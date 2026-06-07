import { NextResponse } from "next/server";

import { adminForbidden, getAdminApiUser, logAdminAction } from "@/lib/auth/admin-api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AnyRecord = Record<string, unknown>;

function fullName(row?: AnyRecord | null) {
  if (!row) return "Unknown";
  const full = String(row.full_name || "").trim();
  const first = String(row.first_name || "").trim();
  const last = String(row.last_name || "").trim();
  return full || [first, last].filter(Boolean).join(" ") || String(row.email || "Unknown");
}

function money(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value || 0);
}

function compactDate(value?: unknown) {
  const date = typeof value === "string" ? value : "";
  if (!date) return "Unknown";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
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

export async function GET(request: Request) {
  try {
    const admin = await getAdminApiUser();
    if (!admin) return adminForbidden();

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("id") || "";
    if (!providerId) return NextResponse.json({ error: "Missing provider id" }, { status: 400 });

    const [seller, profile, services, bookings, bids, reviews, conversations, badges] = await Promise.all([
      singleRow("sellers", "*", "id", providerId),
      singleRow("eloo_profiles", "*", "id", providerId),
      rows("eloo_provider_services", "id,title,description,hourly_rate,min_hours,max_radius_km,is_active,tags,created_at", "provider_id", providerId, 8),
      rows("eloo_bookings", "id,status,total_price,is_paid,city,scheduled_date,created_at,updated_at", "provider_id", providerId, 8),
      rows("bids", "id,inquiry_id,status,amount,message,created_at,updated_at", "provider_id", providerId, 8),
      rows("eloo_reviews", "id,rating,comment,created_at,reviewer_id,reviewee_id", "reviewee_id", providerId, 8),
      rows("eloo_conversations", "id,is_active,last_message_at,created_at", "provider_id", providerId, 8),
      rows("provider_badges", "id,badge_id,awarded_reason,awarded_at", "provider_id", providerId, 8),
    ]);

    const merged = { ...(profile || {}), ...(seller || {}) };
    const hasId = Boolean(seller?.id_document_url);
    const hasSelfie = Boolean(seller?.selfie_video_url);
    const hasInsurance = Boolean(seller?.insurance_document_url || seller?.insurance_status === "approved");
    const completedBookings = bookings.filter((booking) => String(booking.status || "").toLowerCase() === "completed");
    const totalEarnings = bookings.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);
    const paidBookings = bookings.filter((booking) => booking.is_paid === true).length;
    const acceptedBids = bids.filter((bid) => String(bid.status || "").toLowerCase() === "accepted").length;
    const avgReview = reviews.length ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length : 0;

    await logAdminAction({
      actorId: admin.id,
      action: "providers.open_details",
      targetType: "provider",
      targetId: providerId,
      metadata: { email: merged.email || null },
    });

    return NextResponse.json({
      profile: {
        id: providerId,
        name: fullName(merged),
        email: String(merged.email || "Not added"),
        phone: String(merged.phone || "Not added"),
        city: String(merged.city || "Unknown"),
        country: String(merged.country || "Unknown"),
        serviceCategory: String(merged.service_category || "Not set"),
        experience: String(merged.experience_level || "Not set"),
        hourlyRate: merged.hourly_rate ? money(Number(merged.hourly_rate)) : "Not set",
        description: String(merged.description || merged.bio || "Not added"),
        joined: compactDate(merged.created_at),
        updated: compactDate(merged.updated_at),
      },
      verification: {
        sellerRow: Boolean(seller),
        profileRow: Boolean(profile),
        status: String(seller?.status || "unknown"),
        profileVerified: profile?.is_verified === true ? "Verified" : "Not verified",
        emailVerified: seller?.email_verified === true ? "Verified" : "Not verified",
        phoneVerified: seller?.phone_verified === true ? "Verified" : "Not verified",
        idDocument: hasId ? "Added" : "Missing",
        selfieVideo: hasSelfie ? "Added" : "Missing",
        insurance: hasInsurance ? String(seller?.insurance_status || "Added") : "Missing",
        backgroundCheck: String(seller?.background_check_status || "Not added"),
        siret: String(seller?.siret || "Not added"),
      },
      commercial: {
        totalEarnings: money(totalEarnings),
        bookings: bookings.length,
        listedJobs: Number(seller?.total_jobs || 0),
        completedBookings: completedBookings.length,
        paidBookings,
        bids: bids.length,
        acceptedBids,
        activeServices: services.filter((service) => service.is_active !== false).length,
        averageRating: avgReview ? avgReview.toFixed(1) : "No reviews yet",
        reviewCount: reviews.length,
        badges: badges.length,
      },
      services: services.map((service) => ({
        id: String(service.id || ""),
        title: String(service.title || "Untitled service"),
        description: String(service.description || "No description").slice(0, 140),
        rate: service.hourly_rate ? money(Number(service.hourly_rate)) : "No rate",
        meta: `${service.min_hours || 0}h min · ${service.max_radius_km || 0}km radius`,
        status: service.is_active === false ? "Inactive" : "Active",
      })),
      recentBookings: bookings.map((booking) => ({
        id: String(booking.id || "").slice(0, 8),
        primary: `${money(Number(booking.total_price || 0))} · ${booking.is_paid ? "Paid" : "Not paid"}`,
        secondary: `${booking.city || "Unknown"} booking`,
        meta: compactDate(booking.scheduled_date || booking.created_at),
        status: String(booking.status || "unknown"),
      })),
      recentBids: bids.map((bid) => ({
        id: String(bid.id || "").slice(0, 8),
        primary: bid.amount ? money(Number(bid.amount)) : "No amount",
        secondary: String(bid.message || `Inquiry ${String(bid.inquiry_id || "").slice(0, 8)}`).slice(0, 120),
        meta: compactDate(bid.updated_at || bid.created_at),
        status: String(bid.status || "unknown"),
      })),
      recentReviews: reviews.map((review) => ({
        id: String(review.id || "").slice(0, 8),
        primary: `${Number(review.rating || 0).toFixed(1)} star review`,
        secondary: String(review.comment || "No comment").slice(0, 120),
        meta: compactDate(review.created_at),
      })),
      support: {
        conversations: conversations.length,
        activeConversations: conversations.filter((conversation) => conversation.is_active === true).length,
        latestConversation: conversations[0]?.last_message_at ? compactDate(conversations[0].last_message_at) : "None",
      },
      badges: badges.map((badge) => ({
        id: String(badge.id || badge.badge_id || ""),
        primary: String(badge.badge_id || "Badge"),
        secondary: String(badge.awarded_reason || "Awarded"),
        meta: compactDate(badge.awarded_at),
      })),
    });
  } catch (error) {
    console.error("Admin provider details failed:", error);
    return NextResponse.json({ error: "Failed to load provider details" }, { status: 500 });
  }
}
