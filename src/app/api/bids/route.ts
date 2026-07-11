import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { PROVIDER_QUOTE_TERMS_PATH, PROVIDER_QUOTE_TERMS_VERSION } from "@/lib/legal/provider-terms";
import { notifyJobEvent } from "@/lib/notifications/email-functions";
import { getBuyerKycStatus } from "@/lib/kyc/buyer-kyc";
import { getProviderApplicationEntitlement } from "@/lib/plans/provider-plan-server";
import { getProviderStatsMap } from "@/lib/provider-stats";

async function hasSellerKycForQuoting(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
) {
  const { data: seller } = await supabase
    .from("sellers")
    .select("status,id_document_url,selfie_video_url,insurance_document_url,insurance_status")
    .eq("id", userId)
    .maybeSingle();

  if (seller?.status === "approved") {
    return true;
  }

  const { data: profile } = await supabase
    .from("eloo_profiles")
    .select("is_verified")
    .eq("id", userId)
    .maybeSingle();

  return Boolean(profile?.is_verified === true);
}

function requestIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const candidate = forwardedFor || realIp || "";
  return candidate && /^[0-9a-fA-F:.]+$/.test(candidate) ? candidate : null;
}

async function queueProviderTermsFallback(
  admin: { from(table: string): any },
  input: {
    providerUserId: string;
    providerEmail: string;
    providerName: string;
    inquiryId: string;
    bidId: string;
    acceptedAt: string;
    termsVersion: string;
    termsUrl: string;
  }
) {
  const { data: tenant } = await admin
    .from("tenants")
    .select("id,app_url,primary_domain")
    .eq("slug", "default")
    .maybeSingle();

  const acceptedLabel = new Intl.DateTimeFormat("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Dublin",
  }).format(new Date(input.acceptedAt));
  const baseUrl = String(tenant?.app_url || (tenant?.primary_domain ? `https://${tenant.primary_domain}` : "")).replace(/\/$/, "");
  const actionUrl = `${baseUrl}${input.termsUrl}`;
  const htmlBody = [
    `<p>Hi ${input.providerName || "Provider"},</p>`,
    `<p>You accepted the AnyJob provider service terms and conditions on <strong>${acceptedLabel}</strong>.</p>`,
    `<p>Terms version: <strong>${input.termsVersion}</strong></p>`,
    `<p>This timestamp is saved with your quote record for compliance and audit history.</p>`,
    actionUrl ? `<p><a href="${actionUrl}">View accepted terms</a></p>` : "",
  ].join("");

  await admin.from("eloo_notifications").insert({
    user_id: input.providerUserId,
    title: "Provider terms accepted",
    message: `You accepted the provider service terms on ${acceptedLabel}.`,
    type: "provider_terms_accepted",
    action_url: `/pro/jobs/${input.inquiryId}`,
    is_read: false,
    data: {
      job_id: input.inquiryId,
      bid_id: input.bidId,
      terms_version: input.termsVersion,
      accepted_at: input.acceptedAt,
      fallback: true,
    },
  });

  if (!tenant?.id) return;

  const { error } = await admin.from("email_outbox").insert({
    tenant_id: tenant.id,
    event_key: "legal.provider_terms_accepted",
    dedupe_key: `provider-terms-accepted:${input.inquiryId}:${input.providerUserId}:${input.termsVersion}`,
    recipient_user_id: input.providerUserId,
    recipient_email: input.providerEmail,
    subject: "You accepted AnyJob provider terms",
    html_body: htmlBody,
    text_body: `You accepted the AnyJob provider service terms and conditions on ${acceptedLabel}. Terms version: ${input.termsVersion}.`,
    status: "pending",
    source_table: "provider_terms_acceptances",
    source_id: input.bidId,
    metadata: {
      job_id: input.inquiryId,
      bid_id: input.bidId,
      terms_version: input.termsVersion,
      accepted_at: input.acceptedAt,
      fallback: true,
    },
  });

  if (error && error.code !== "23505") {
    console.error("Provider terms fallback email queue failed:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { inquiry_id, amount, message, estimated_duration_hours, available_date, terms_accepted, terms_version } = body;

    if (!inquiry_id || !amount) {
      return NextResponse.json({ error: "inquiry_id and amount are required" }, { status: 400 });
    }

    if (terms_accepted !== true) {
      return NextResponse.json({ error: "You must accept the provider service terms before sending a quote." }, { status: 400 });
    }

    const acceptedTermsVersion = String(terms_version || PROVIDER_QUOTE_TERMS_VERSION);
    if (acceptedTermsVersion !== PROVIDER_QUOTE_TERMS_VERSION) {
      return NextResponse.json({ error: "The provider service terms changed. Refresh and accept the latest terms before quoting." }, { status: 409 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }

    // Verify the inquiry exists and has been approved by admin (open for bids)
    const { data: inquiry, error: inquiryError } = await supabase
      .from("service_inquiries")
      .select("*")
      .eq("id", inquiry_id)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json({ error: "Service inquiry not found" }, { status: 404 });
    }

    if (!["approved", "submitted"].includes(String(inquiry.status || "").toLowerCase())) {
      return NextResponse.json({ error: "This job is not approved for quotes yet" }, { status: 409 });
    }

    // Provider cannot bid on their own inquiry
    if (inquiry.user_id === user.id) {
      return NextResponse.json({ error: "You cannot bid on your own inquiry" }, { status: 403 });
    }

    const admin = createAdminSupabaseClient() as never as { from(table: string): any };
    const buyerKyc = await getBuyerKycStatus(admin, inquiry.user_id);
    if (!buyerKyc.isComplete) {
      return NextResponse.json(
        {
          error: `Buyer KYC is pending. The buyer must upload ${buyerKyc.missing.join(", ")} before providers can send quotes.`,
          missingKyc: buyerKyc.missing,
        },
        { status: 409 }
      );
    }

    // Check if provider is a registered provider
    const { data: provider } = await supabase
      .from("eloo_profiles")
      .select("id, first_name, last_name, email")
      .eq("id", user.id)
      .single();

    if (!provider) {
      return NextResponse.json({ error: "Only registered providers can place bids" }, { status: 403 });
    }

    const sellerKycComplete = await hasSellerKycForQuoting(supabase, user.id);
    if (!sellerKycComplete) {
      return NextResponse.json(
        { error: "Seller account limited. Complete and approve KYC before sending quotes." },
        { status: 403 }
      );
    }

    const { data: existingBid } = await supabase
      .from("bids")
      .select("id")
      .eq("inquiry_id", inquiry_id)
      .eq("provider_id", user.id)
      .maybeSingle();

    if (existingBid) {
      return NextResponse.json({ error: "You have already placed a bid on this job" }, { status: 409 });
    }

    const entitlement = await getProviderApplicationEntitlement(admin, user.id);
    if (!entitlement.allowed) {
      return NextResponse.json(
        {
          error: entitlement.message,
          upgradeRequired: true,
          pricingUrl: "/pricing",
          plan: entitlement.plan,
          usage: entitlement.usage,
        },
        { status: 402 }
      );
    }

    // Insert bid
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .insert({
        inquiry_id,
        provider_id: user.id,
        amount,
        message: message || null,
        estimated_duration_hours: estimated_duration_hours || null,
        available_date: available_date || null,
        status: "pending",
      })
      .select()
      .single();

    if (bidError) {
      if (bidError.code === "23505") {
        return NextResponse.json({ error: "You have already placed a bid on this job" }, { status: 409 });
      }
      throw bidError;
    }

    const acceptedAt = new Date().toISOString();
    const providerEmail = String(provider.email || user.email || "").trim().toLowerCase();
    const acceptancePayload = {
      provider_id: user.id,
      provider_email: providerEmail,
      inquiry_id,
      bid_id: bid.id,
      terms_version: PROVIDER_QUOTE_TERMS_VERSION,
      terms_url: PROVIDER_QUOTE_TERMS_PATH,
      accepted_at: acceptedAt,
      accepted_ip: requestIp(request),
      accepted_user_agent: request.headers.get("user-agent") || null,
    };

    const { data: acceptance, error: acceptanceError } = await admin
      .from("provider_terms_acceptances")
      .insert(acceptancePayload)
      .select("id,accepted_at,terms_version,terms_url,provider_email")
      .single();

    let termsAcceptance = acceptance;
    if (acceptanceError?.code === "23505") {
      const { data: existingAcceptance, error: updateAcceptanceError } = await admin
        .from("provider_terms_acceptances")
        .update({ bid_id: bid.id, updated_at: acceptedAt })
        .eq("provider_id", user.id)
        .eq("inquiry_id", inquiry_id)
        .eq("terms_version", PROVIDER_QUOTE_TERMS_VERSION)
        .select("id,accepted_at,terms_version,terms_url,provider_email")
        .single();

      if (updateAcceptanceError) {
        await admin.from("bids").delete().eq("id", bid.id).eq("provider_id", user.id);
        return NextResponse.json({ error: "Failed to save provider terms acceptance" }, { status: 500 });
      }
      termsAcceptance = existingAcceptance;
    } else if (acceptanceError) {
      await admin.from("bids").delete().eq("id", bid.id).eq("provider_id", user.id);
      return NextResponse.json({ error: "Failed to save provider terms acceptance" }, { status: 500 });
    }

    const emailResult = await notifyJobEvent({
      action: "provider_terms_accepted",
      tenantSlug: "default",
      providerUserId: user.id,
      providerEmail,
      providerName: [provider.first_name, provider.last_name].filter(Boolean).join(" "),
      jobId: inquiry_id,
      bidId: bid.id,
      acceptedAt: termsAcceptance?.accepted_at || acceptedAt,
      termsVersion: termsAcceptance?.terms_version || PROVIDER_QUOTE_TERMS_VERSION,
      termsUrl: termsAcceptance?.terms_url || PROVIDER_QUOTE_TERMS_PATH,
    });

    if (!emailResult.ok) {
      console.error("Provider terms acceptance email failed:", emailResult);
      await queueProviderTermsFallback(admin, {
        providerUserId: user.id,
        providerEmail,
        providerName: [provider.first_name, provider.last_name].filter(Boolean).join(" "),
        inquiryId: inquiry_id,
        bidId: bid.id,
        acceptedAt: termsAcceptance?.accepted_at || acceptedAt,
        termsVersion: termsAcceptance?.terms_version || PROVIDER_QUOTE_TERMS_VERSION,
        termsUrl: termsAcceptance?.terms_url || PROVIDER_QUOTE_TERMS_PATH,
      });
    }

    return NextResponse.json({ bid, termsAcceptance }, { status: 201 });
  } catch (error) {
    console.error("Error creating bid:", error);
    return NextResponse.json({ error: "Failed to create bid" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const inquiryId = searchParams.get("inquiry_id");
    const role = searchParams.get("role"); // "provider" or "client"

    let query = supabase
      .from("bids")
      .select(`
        *,
        inquiry:service_inquiries!bids_inquiry_id_fkey(
          id, category_slug, subcategory_slug, job_description, city, preferred_date, budget_range_min, budget_range_max, user_id
        )
      `)
      .order("created_at", { ascending: false });

    if (inquiryId) {
      query = query.eq("inquiry_id", inquiryId);
    }

    if (role === "provider") {
      query = query.eq("provider_id", user.id);
    }

    const { data: bids, error: bidsError } = await query;

    if (bidsError) throw bidsError;

    const admin = createAdminSupabaseClient() as never as { from(table: string): any };
    const providerIds = Array.from(new Set((bids || []).map((bid) => String(bid.provider_id || "")).filter(Boolean)));
    const [profilesResult, sellersResult, providerStatsById] = providerIds.length
      ? await Promise.all([
          admin
            .from("eloo_profiles")
            .select("id, first_name, last_name, profile_image_url")
            .in("id", providerIds),
          admin
            .from("sellers")
            .select("id, first_name, last_name, profile_image_url, service_category, experience_level")
            .in("id", providerIds),
          getProviderStatsMap(admin, providerIds),
        ])
      : [{ data: [] }, { data: [] }, new Map()];

    const profilesById = new Map(((profilesResult.data || []) as Record<string, any>[]).map((profile) => [String(profile.id), profile]));
    const sellersById = new Map(((sellersResult.data || []) as Record<string, any>[]).map((seller) => [String(seller.id), seller]));

    const bidsWithProviders = await Promise.all(
      (bids || []).map(async (bid) => {
        const providerId = String(bid.provider_id || "");
        const profile = profilesById.get(providerId) || {};
        const seller = sellersById.get(providerId) || {};
        const providerStats = providerStatsById.get(providerId) || { rating: 0, reviewCount: 0, completedJobs: 0 };

        return {
          ...bid,
          provider: {
            id: providerId,
            first_name: seller.first_name || profile.first_name || "Provider",
            last_name: seller.last_name || profile.last_name || "",
            profile_image_url: seller.profile_image_url || profile.profile_image_url || null,
            rating: providerStats.rating,
            total_jobs: providerStats.completedJobs,
            review_count: providerStats.reviewCount,
            service_category: seller.service_category || null,
            experience_level: seller.experience_level || null,
          },
        };
      })
    );

    return NextResponse.json({ bids: bidsWithProviders });
  } catch (error) {
    console.error("Error fetching bids:", error);
    return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bid_id, action } = body; // action: "accept", "reject", "withdraw"

    if (!bid_id || !action) {
      return NextResponse.json({ error: "bid_id and action are required" }, { status: 400 });
    }

    // Get the bid
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .select("*, inquiry:service_inquiries!bids_inquiry_id_fkey(*)")
      .eq("id", bid_id)
      .single();

    if (bidError || !bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    if (action === "withdraw") {
      // Only provider can withdraw their bid
      if (bid.provider_id !== user.id) {
        return NextResponse.json({ error: "Only the provider can withdraw their bid" }, { status: 403 });
      }
      if (bid.status !== "pending") {
        return NextResponse.json({ error: "Can only withdraw pending bids" }, { status: 400 });
      }

      const { data: updated, error } = await supabase
        .from("bids")
        .update({ status: "withdrawn", updated_at: new Date().toISOString() })
        .eq("id", bid_id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ bid: updated });
    }

    if (action === "accept" || action === "reject") {
      // Only the inquiry owner (client) can accept/reject
      if (bid.inquiry.user_id !== user.id) {
        return NextResponse.json({ error: "Only the client can accept or reject bids" }, { status: 403 });
      }
      if (bid.status !== "pending") {
        return NextResponse.json({ error: "Can only accept/reject pending bids" }, { status: 400 });
      }

      if (action === "accept") {
        return NextResponse.json(
          { error: "Use Stripe checkout to accept and pay the AnyJob fee." },
          { status: 409 }
        );
      }

      const timestamp = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from("bids")
        .update({
          status: "rejected",
          rejected_at: timestamp,
          updated_at: timestamp,
        })
        .eq("id", bid_id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ bid: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating bid:", error);
    return NextResponse.json({ error: "Failed to update bid" }, { status: 500 });
  }
}
