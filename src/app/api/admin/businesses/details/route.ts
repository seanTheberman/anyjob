import { NextResponse } from "next/server";

import { adminForbidden, getAdminApiUser, logAdminAction } from "@/lib/auth/admin-api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AnyRecord = Record<string, unknown>;

function money(value: number, currency = "EUR") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(value || 0);
}

function compactDate(value?: unknown) {
  const date = typeof value === "string" ? value : "";
  if (!date) return "Unknown";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}

function daysAgo(value?: string | null) {
  if (!value) return "Unknown";
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "Recently";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function fullName(row?: AnyRecord | null) {
  if (!row) return "Unknown";
  const full = String(row.full_name || "").trim();
  const first = String(row.first_name || "").trim();
  const last = String(row.last_name || "").trim();
  return full || [first, last].filter(Boolean).join(" ") || String(row.email || "Unknown");
}

function latestDate(values: unknown[]) {
  return values
    .map((value) => typeof value === "string" ? new Date(value).getTime() : 0)
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => b - a)[0] || 0;
}

function parseDocuments(value: unknown, source: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return [];

  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item, index) => {
        const record = item && typeof item === "object" ? item as AnyRecord : {};
        const upload = record.upload && typeof record.upload === "object" ? record.upload as AnyRecord : null;
        return {
          id: String(record.type || index),
          primary: String(record.label || record.type || "Business document"),
          secondary: record.link ? String(record.link) : upload?.fileName ? String(upload.fileName) : "Uploaded document",
          meta: record.required ? "Required" : "Recommended",
          status: record.link || upload ? "Added" : "Missing",
        };
      });
    }
  } catch {
    // Fall back to the legacy single document shape below.
  }

  return [{
    id: "document",
    primary: "Business verification document",
    secondary: text,
    meta: String(source || "Document"),
    status: "Added",
  }];
}

async function singleRow(table: string, select: string, column: string, value: string) {
  const supabase = createAdminSupabaseClient() as never as {
    from(name: string): {
      select(columns: string): {
        eq(key: string, eqValue: string): {
          maybeSingle(): Promise<{ data: AnyRecord | null; error: { message: string } | null }>;
        };
      };
    };
  };

  try {
    const { data, error } = await supabase.from(table).select(select).eq(column, value).maybeSingle();
    if (error) return null;
    return data || null;
  } catch {
    return null;
  }
}

async function rows(table: string, select: string, column: string, value: string, limit = 10) {
  const supabase = createAdminSupabaseClient() as never as {
    from(name: string): {
      select(columns: string): {
        eq(key: string, eqValue: string): {
          order(orderColumn: string, options?: { ascending?: boolean }): {
            limit(count: number): Promise<{ data: AnyRecord[] | null; error: { message: string } | null }>;
          };
          limit(count: number): Promise<{ data: AnyRecord[] | null; error: { message: string } | null }>;
        };
      };
    };
  };

  try {
    const { data, error } = await supabase.from(table).select(select).eq(column, value).order("created_at", { ascending: false }).limit(limit);
    if (error) return [];
    return data || [];
  } catch {
    try {
      const { data, error } = await supabase.from(table).select(select).eq(column, value).limit(limit);
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }
}

async function rowsIn(table: string, select: string, column: string, values: string[], limit = 25) {
  if (!values.length) return [];
  const supabase = createAdminSupabaseClient() as never as {
    from(name: string): {
      select(columns: string): {
        in(key: string, inValues: string[]): {
          limit(count: number): Promise<{ data: AnyRecord[] | null; error: { message: string } | null }>;
        };
      };
    };
  };

  try {
    const { data, error } = await supabase.from(table).select(select).in(column, values).limit(limit);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const admin = await getAdminApiUser();
    if (!admin) return adminForbidden();

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("id") || "";
    if (!businessId) return NextResponse.json({ error: "Missing business id" }, { status: 400 });

    const business = await singleRow("business_profiles", "*", "id", businessId);
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const ownerUserId = String(business.owner_user_id || "");
    const [
      ownerProfile,
      ownerUserProfile,
      posts,
      applications,
      payments,
      conversations,
      notifications,
    ] = await Promise.all([
      ownerUserId ? singleRow("eloo_profiles", "*", "id", ownerUserId) : Promise.resolve(null),
      ownerUserId ? singleRow("user_profiles", "*", "id", ownerUserId) : Promise.resolve(null),
      rows(
        "business_work_posts",
        "id,work_type,industry,niche,role_title,description,city,status,headcount,business_preferred_hourly_rate,business_preferred_day_rate,starts_at,ends_at,created_at,updated_at",
        "business_id",
        businessId,
        10
      ),
      rows(
        "shift_applications",
        "id,business_work_post_id,provider_user_id,status,proposed_hourly_rate,proposed_day_rate,message,applied_at,accepted_at,completed_at,created_at,updated_at",
        "business_id",
        businessId,
        12
      ),
      rows(
        "shift_escrow_payments",
        "id,business_work_post_id,shift_application_id,provider_user_id,agreed_amount,platform_fee,total_charged,currency,status,payment_reference,paid_at,released_at,created_at,updated_at",
        "business_id",
        businessId,
        12
      ),
      ownerUserId ? rows("eloo_conversations", "id,is_active,last_message_at,created_at", "client_id", ownerUserId, 6) : Promise.resolve([]),
      ownerUserId ? rows("eloo_notifications", "id,title,type,is_read,created_at", "user_id", ownerUserId, 6) : Promise.resolve([]),
    ]);

    const providerIds = Array.from(new Set(applications.map((application) => String(application.provider_user_id || "")).filter(Boolean)));
    const [providerProfiles, providerSellers] = await Promise.all([
      rowsIn("eloo_profiles", "id,email,full_name,first_name,last_name", "id", providerIds, 50),
      rowsIn("sellers", "id,email,first_name,last_name", "id", providerIds, 50),
    ]);
    const providersById = new Map<string, AnyRecord>();
    for (const provider of providerProfiles) providersById.set(String(provider.id), provider);
    for (const seller of providerSellers) providersById.set(String(seller.id), { ...(providersById.get(String(seller.id)) || {}), ...seller });

    const acceptedApplications = applications.filter((application) => ["accepted", "completed"].includes(String(application.status || "").toLowerCase()));
    const activePosts = posts.filter((post) => ["submitted", "filled"].includes(String(post.status || "").toLowerCase()));
    const activeShifts = posts.filter((post) => (
      ["part_time_day_wage", "long_duration_shift"].includes(String(post.work_type || "")) &&
      ["submitted", "filled"].includes(String(post.status || "").toLowerCase())
    ));
    const activePayments = payments.filter((payment) => ["requires_payment", "held"].includes(String(payment.status || "").toLowerCase()));
    const paidPayments = payments.filter((payment) => ["held", "released"].includes(String(payment.status || "").toLowerCase()) || Boolean(payment.paid_at));
    const releasedPayments = payments.filter((payment) => String(payment.status || "").toLowerCase() === "released");
    const totalPaid = paidPayments.reduce((sum, payment) => sum + Number(payment.total_charged || 0), 0);
    const totalHeld = payments.filter((payment) => String(payment.status || "").toLowerCase() === "held").reduce((sum, payment) => sum + Number(payment.total_charged || 0), 0);
    const currency = String(payments[0]?.currency || "EUR");
    const documents = parseDocuments(business.document_url, business.document_source);
    const missingRequiredDocuments = documents.filter((document) => document.meta === "Required" && document.status !== "Added").length;
    const isApproved = String(business.status || "").toLowerCase() === "approved";
    const latestActivityAt = latestDate([
      business.updated_at,
      ...posts.flatMap((post) => [post.updated_at, post.created_at]),
      ...applications.flatMap((application) => [application.updated_at, application.created_at, application.accepted_at, application.completed_at]),
      ...payments.flatMap((payment) => [payment.updated_at, payment.created_at, payment.paid_at, payment.released_at]),
      ...conversations.flatMap((conversation) => [conversation.last_message_at, conversation.created_at]),
      ...notifications.map((notification) => notification.created_at),
    ]);

    await logAdminAction({
      actorId: admin.id,
      action: "businesses.open_details",
      targetType: "business",
      targetId: businessId,
      metadata: { ownerUserId, registrationNumber: business.registration_number || null },
    });

    return NextResponse.json({
      profile: {
        id: businessId,
        ownerUserId,
        name: String(business.business_name || "Unknown business"),
        legalName: String(business.legal_name || business.business_name || "Unknown"),
        registrationNumber: String(business.registration_number || "Missing"),
        businessType: String(business.business_type || "Not set"),
        industry: String(business.industry || "Unknown"),
        contactName: String(business.contact_name || "Not set"),
        contactEmail: String(business.contact_email || "Not set"),
        contactPhone: String(business.contact_phone || "Not set"),
        address: String(business.address || "Not set"),
        city: String(business.city || "Unknown"),
        postalCode: String(business.postal_code || "Not set"),
        country: String(business.country || "Unknown"),
        joined: compactDate(business.created_at),
        updated: daysAgo(String(business.updated_at || business.created_at || "")),
        lastActivity: latestActivityAt ? daysAgo(new Date(latestActivityAt).toISOString()) : "Unknown",
      },
      owner: {
        name: fullName({ ...(ownerProfile || {}), ...(ownerUserProfile || {}) }),
        email: String(ownerProfile?.email || ownerUserProfile?.email || business.contact_email || "Not added"),
        phone: String(ownerProfile?.phone || ownerUserProfile?.phone || business.contact_phone || "Not added"),
        profileRow: Boolean(ownerProfile),
        userProfileRow: Boolean(ownerUserProfile),
        role: String(ownerProfile?.role || ownerUserProfile?.role || "client"),
        updated: daysAgo(String(ownerProfile?.updated_at || ownerUserProfile?.updated_at || ownerProfile?.created_at || "")),
      },
      verification: {
        status: String(business.status || "pending"),
        verified: isApproved ? "Verified" : "Not verified",
        reviewedAt: business.reviewed_at ? compactDate(business.reviewed_at) : "Not reviewed",
        rejectionReason: String(business.rejection_reason || "None"),
        registration: business.registration_number ? "Added" : "Missing",
        documentCount: documents.length,
        missingRequiredDocuments,
        documentSource: String(business.document_source || "Not added"),
      },
      commercial: {
        hires: acceptedApplications.length,
        jobs: posts.length,
        activeJobs: activePosts.length,
        activeShifts: activeShifts.length,
        applications: applications.length,
        activePayments: activePayments.length,
        paidPayments: paidPayments.length,
        releasedPayments: releasedPayments.length,
        totalPaid: money(totalPaid, currency),
        totalHeld: money(totalHeld, currency),
      },
      workSetup: {
        workTypes: Array.isArray(business.typical_work_types) ? business.typical_work_types.map(String) : [],
        roles: Array.isArray(business.typical_roles_needed) ? business.typical_roles_needed.map(String) : [],
      },
      documents,
      recentPosts: posts.map((post) => ({
        id: String(post.id || "").slice(0, 8),
        primary: String(post.role_title || post.niche || "Business work"),
        secondary: String(post.description || "No description").slice(0, 140),
        meta: `${post.work_type || "work"} · ${post.city || "Unknown"} · ${post.headcount || 1} worker${Number(post.headcount || 1) === 1 ? "" : "s"} · ${compactDate(post.starts_at || post.created_at)}`,
        status: String(post.status || "unknown"),
      })),
      recentApplications: applications.map((application) => {
        const provider = providersById.get(String(application.provider_user_id || ""));
        return {
          id: String(application.id || "").slice(0, 8),
          primary: fullName(provider),
          secondary: String(application.message || `Provider ${String(application.provider_user_id || "").slice(0, 8)}`).slice(0, 140),
          meta: [
            application.proposed_day_rate ? `${money(Number(application.proposed_day_rate), currency)}/day` : "",
            application.proposed_hourly_rate ? `${money(Number(application.proposed_hourly_rate), currency)}/hr` : "",
            compactDate(application.accepted_at || application.applied_at || application.created_at),
          ].filter(Boolean).join(" · "),
          status: String(application.status || "unknown"),
        };
      }),
      recentPayments: payments.map((payment) => ({
        id: String(payment.id || "").slice(0, 8),
        primary: `${money(Number(payment.total_charged || 0), String(payment.currency || currency))} charged`,
        secondary: `${money(Number(payment.agreed_amount || 0), String(payment.currency || currency))} provider amount · ${money(Number(payment.platform_fee || 0), String(payment.currency || currency))} platform fee`,
        meta: payment.payment_reference ? String(payment.payment_reference) : compactDate(payment.paid_at || payment.created_at),
        status: String(payment.status || "unknown"),
      })),
      support: {
        conversations: conversations.length,
        activeConversations: conversations.filter((conversation) => conversation.is_active === true).length,
        unreadNotifications: notifications.filter((notification) => notification.is_read === false).length,
        latestNotification: notifications[0]?.title ? String(notifications[0].title) : "None",
        latestConversation: conversations[0]?.last_message_at ? compactDate(conversations[0].last_message_at) : "None",
      },
    });
  } catch (error) {
    console.error("Admin business details failed:", error);
    return NextResponse.json({ error: "Failed to load business details" }, { status: 500 });
  }
}
