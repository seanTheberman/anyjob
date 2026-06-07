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

function daysAgo(value?: string | null) {
  if (!value) return "Unknown";
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "Recently";
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
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

async function serviceInquiriesFor(userId: string, email: string) {
  const byUser = await rows(
    "service_inquiries",
    "id,user_id,email,category_slug,subcategory_slug,service_type,job_description,status,city,budget_range_min,budget_range_max,created_at,submitted_at,preferred_date",
    "user_id",
    userId,
    6
  );
  if (byUser.length || !email) return byUser;
  return rows(
    "service_inquiries",
    "id,user_id,email,category_slug,subcategory_slug,service_type,job_description,status,city,budget_range_min,budget_range_max,created_at,submitted_at,preferred_date",
    "email",
    email,
    6
  );
}

export async function GET(request: Request) {
  try {
    const admin = await getAdminApiUser();
    if (!admin) return adminForbidden();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id") || "";
    if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

    const [profile, buyer, flag] = await Promise.all([
      singleRow("eloo_profiles", "*", "id", userId),
      singleRow("buyers", "*", "id", userId),
      singleRow("admin_user_flags", "*", "user_id", userId),
    ]);
    const merged = { ...(profile || {}), ...(buyer || {}) };
    const email = String(merged.email || "");

    const [bookings, inquiries, reviews, conversations, notifications] = await Promise.all([
      rows("eloo_bookings", "id,status,total_price,is_paid,city,scheduled_date,created_at,updated_at", "client_id", userId, 6),
      serviceInquiriesFor(userId, email),
      rows("eloo_reviews", "id,rating,comment,created_at,reviewer_id,reviewee_id", "reviewer_id", userId, 6),
      rows("eloo_conversations", "id,is_active,last_message_at,created_at", "client_id", userId, 6),
      rows("eloo_notifications", "id,title,type,is_read,created_at", "user_id", userId, 6),
    ]);

    const totalSpent = bookings.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);
    const paidBookings = bookings.filter((booking) => booking.is_paid === true).length;
    const completedBookings = bookings.filter((booking) => String(booking.status || "").toLowerCase() === "completed").length;
    const averageGivenRating = reviews.length
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
      : 0;

    const categoryCounts = new Map<string, number>();
    for (const inquiry of inquiries) {
      const label = String(inquiry.subcategory_slug || inquiry.category_slug || inquiry.service_type || "Unknown service").replaceAll("-", " ");
      categoryCounts.set(label, (categoryCounts.get(label) || 0) + 1);
    }
    const preferredServices = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => `${label}${count > 1 ? ` (${count})` : ""}`)
      .slice(0, 4);

    await logAdminAction({
      actorId: admin.id,
      action: "users.open_details",
      targetType: "user",
      targetId: userId,
      metadata: { email },
    });

    return NextResponse.json({
      profile: {
        id: userId,
        name: fullName(merged),
        email,
        phone: String(merged.phone || "Not added"),
        role: String(merged.role || "client"),
        city: String(merged.city || "Unknown"),
        postalCode: String(merged.postal_code || "Not added"),
        bio: String(merged.bio || "Not added"),
        joined: compactDate(merged.created_at),
        updated: daysAgo(String(merged.updated_at || merged.created_at || "")),
      },
      verification: {
        profileExists: Boolean(profile),
        buyerProfileExists: Boolean(buyer),
        emailVerified: buyer?.email_verified === true ? "Verified" : buyer?.email_verified === false ? "Not verified" : "Not added",
        platformKyc: profile?.is_verified === true ? "Verified" : "Not verified",
        stripeCustomerOrAccount: merged.stripe_customer_id || merged.stripe_account_id ? "Added" : "Not added",
      },
      commercial: {
        totalSpent: money(totalSpent),
        bookings: bookings.length,
        paidBookings,
        completedBookings,
        openRequests: inquiries.filter((inquiry) => !["completed", "cancelled", "expired"].includes(String(inquiry.status || "").toLowerCase())).length,
        averageGivenRating: averageGivenRating ? averageGivenRating.toFixed(1) : "No ratings yet",
        preferredServices: preferredServices.length ? preferredServices : ["Not enough job history"],
      },
      risk: {
        status: String(flag?.status || "active"),
        riskOverride: String(flag?.risk_override || "None"),
        note: String(flag?.note || "No admin note"),
        updated: flag?.updated_at ? daysAgo(String(flag.updated_at)) : "No admin flag",
      },
      recentJobs: inquiries.map((inquiry) => ({
        id: String(inquiry.id || ""),
        service: String(inquiry.subcategory_slug || inquiry.category_slug || inquiry.service_type || "Service").replaceAll("-", " "),
        description: String(inquiry.job_description || "No description").slice(0, 140),
        status: String(inquiry.status || "unknown"),
        city: String(inquiry.city || "Unknown"),
        budget: inquiry.budget_range_min || inquiry.budget_range_max
          ? `${money(Number(inquiry.budget_range_min || 0))} - ${money(Number(inquiry.budget_range_max || 0))}`
          : "No budget",
        posted: compactDate(inquiry.submitted_at || inquiry.created_at),
      })),
      recentPayments: bookings.map((booking) => ({
        id: String(booking.id || "").slice(0, 8),
        amount: money(Number(booking.total_price || 0)),
        status: String(booking.status || "unknown"),
        paid: booking.is_paid === true ? "Paid" : "Not paid",
        city: String(booking.city || "Unknown"),
        date: compactDate(booking.scheduled_date || booking.created_at),
      })),
      recentReviews: reviews.map((review) => ({
        id: String(review.id || "").slice(0, 8),
        rating: Number(review.rating || 0).toFixed(1),
        comment: String(review.comment || "No comment").slice(0, 120),
        date: compactDate(review.created_at),
      })),
      support: {
        conversations: conversations.length,
        activeConversations: conversations.filter((conversation) => conversation.is_active === true).length,
        unreadNotifications: notifications.filter((notification) => notification.is_read === false).length,
        latestNotification: notifications[0]?.title ? String(notifications[0].title) : "None",
      },
    });
  } catch (error) {
    console.error("Admin user details failed:", error);
    return NextResponse.json({ error: "Failed to load user details" }, { status: 500 });
  }
}
