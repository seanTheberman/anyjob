import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { calculateBookingTokenBreakdown } from "@/lib/booking-token";
import { mapSupportTicketRow, type SupportTicket } from "@/lib/support/tickets";
import type { AdminBusiness, AdminLiveJob, AdminProvider, AdminUser, KycReview } from "../_components/admin-data";

type AnyRecord = Record<string, unknown>;

function fullName(row: AnyRecord) {
  const first = String(row.first_name || "").trim();
  const last = String(row.last_name || "").trim();
  const full = String(row.full_name || "").trim();
  return full || [first, last].filter(Boolean).join(" ") || String(row.email || "Unknown");
}

function money(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value || 0);
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

function compactDateTime(value?: string | null) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function readableList(values: unknown, fallback = "Not set") {
  if (!Array.isArray(values) || !values.length) return fallback;
  return values.map((value) => titleCase(String(value))).join(", ");
}

function providerMetadata(row: AnyRecord) {
  return row.availability && typeof row.availability === "object" ? row.availability as AnyRecord : {};
}

function providerAccountType(row: AnyRecord) {
  return String(providerMetadata(row).providerAccountType || "").toLowerCase();
}

function providerBusinessName(row: AnyRecord) {
  const metadata = providerMetadata(row);
  return String(metadata.businessName || metadata.companyName || "").trim();
}

function isContractorProvider(row: AnyRecord) {
  const accountType = providerAccountType(row);
  return accountType === "business" || accountType === "agency";
}

async function maybeRows<T = AnyRecord>(table: string, select = "*", limit = 100): Promise<T[]> {
  const supabase = createAdminSupabaseClient();
  const client = supabase as never as {
    from: (name: string) => {
      select: (columns?: string) => {
        order: (column: string, options?: { ascending?: boolean }) => {
          limit: (count: number) => Promise<{ data: T[] | null; error: { message: string } | null }>;
        };
        limit: (count: number) => Promise<{ data: T[] | null; error: { message: string } | null }>;
      };
    };
  };

  try {
    const { data, error } = await client.from(table).select(select).order("created_at", { ascending: false }).limit(limit);
    if (error) return [];
    return data || [];
  } catch {
    try {
      const { data, error } = await client.from(table).select(select).limit(limit);
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }
}

async function maybeRowsWithFallback<T = AnyRecord>(table: string, select = "*", fallbackSelect = select, limit = 100): Promise<T[]> {
  const rows = await maybeRows<T>(table, select, limit);
  if (rows.length || fallbackSelect === select) return rows;
  return maybeRows<T>(table, fallbackSelect, limit);
}

async function maybeRowsWhereIn<T = AnyRecord>(table: string, select: string, column: string, values: string[], limit = 1000): Promise<T[]> {
  if (!values.length) return [];
  const supabase = createAdminSupabaseClient();
  const client = supabase as never as {
    from: (name: string) => {
      select: (columns?: string) => {
        in: (column: string, values: string[]) => {
          limit: (count: number) => Promise<{ data: T[] | null; error: { message: string } | null }>;
        };
      };
    };
  };

  try {
    const { data, error } = await client.from(table).select(select).in(column, values).limit(limit);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

function mergeUserRow(existing: AnyRecord | undefined, incoming: AnyRecord): AnyRecord {
  return {
    ...(existing || {}),
    ...incoming,
    is_active: incoming.is_active === undefined ? existing?.is_active : incoming.is_active,
  };
}

async function maybeCount(table: string) {
  const supabase = createAdminSupabaseClient();
  const client = supabase as never as {
    from: (name: string) => {
      select: (columns: string, options: { count: "exact"; head: true }) => Promise<{ count: number | null; error: unknown }>;
    };
  };

  try {
    const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

function idDocumentCounts(images: AnyRecord[]) {
  const counts = new Map<string, number>();
  for (const image of images) {
    if (String(image.image_type || "") !== "id_document") continue;
    const userId = String(image.user_id || "");
    if (!userId) continue;
    counts.set(userId, (counts.get(userId) || 0) + 1);
  }
  return counts;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const [profiles, userProfiles, buyers, bookings] = await Promise.all([
    maybeRowsWithFallback<AnyRecord>(
      "eloo_profiles",
      "id,role,email,first_name,last_name,city,is_active,updated_at,created_at",
      "id,role,email,first_name,last_name,city,updated_at,created_at",
      100
    ),
    maybeRows<AnyRecord>("user_profiles", "id,role,email,full_name,is_active,last_login_at,updated_at,created_at", 500),
    maybeRowsWithFallback<AnyRecord>(
      "buyers",
      "id,email,first_name,last_name,city,email_verified,is_active,updated_at,created_at",
      "id,email,first_name,last_name,city,email_verified,updated_at,created_at",
      100
    ),
    maybeRows<AnyRecord>("eloo_bookings", "id,client_id,total_price,status,created_at", 1000),
  ]);

  const bookingsByUser = new Map<string, { count: number; spend: number }>();
  for (const booking of bookings) {
    const clientId = String(booking.client_id || "");
    if (!clientId) continue;
    const current = bookingsByUser.get(clientId) || { count: 0, spend: 0 };
    current.count += 1;
    current.spend += Number(booking.total_price || 0);
    bookingsByUser.set(clientId, current);
  }
  const merged = new Map<string, AnyRecord>();
  for (const profile of userProfiles) {
    const role = String(profile.role || "").toLowerCase();
    if (role === "provider" || role === "seller") continue;
    merged.set(String(profile.id), profile);
  }
  for (const profile of profiles) {
    const role = String(profile.role || "").toLowerCase();
    if (role === "provider" || role === "seller") continue;
    merged.set(String(profile.id), mergeUserRow(merged.get(String(profile.id)), profile));
  }
  for (const buyer of buyers) {
    merged.set(String(buyer.id), { ...mergeUserRow(merged.get(String(buyer.id)), buyer), role: "client" });
  }

  const flags = await maybeRowsWhereIn<AnyRecord>(
    "admin_user_flags",
    "user_id,status,risk_override,note,updated_at",
    "user_id",
    Array.from(merged.keys()),
    Math.max(merged.size, 1)
  );
  const flagsByUser = new Map(flags.map((flag) => [String(flag.user_id), flag]));

  return Array.from(merged.values()).map((row) => {
    const id = String(row.id);
    const flag = flagsByUser.get(id);
    const flagStatus = String(flag?.status || "").toLowerCase();
    const isActive = row.is_active !== false && flagStatus !== "blocked";
    const emailVerified = row.email_verified !== false;
    const risk = flag?.risk_override ? String(flag.risk_override) : !isActive ? "High" : flagStatus === "watchlisted" ? "Medium" : !emailVerified ? "Medium" : "Low";
    const status = !isActive ? "Suspended" : flagStatus === "watchlisted" ? "Watchlisted" : !emailVerified ? "Pending email" : "Active";
    const userBookings = bookingsByUser.get(id) || { count: 0, spend: 0 };

    return {
      id,
      name: fullName(row),
      role: String(row.role || "client"),
      email: String(row.email || ""),
      city: String(row.city || "Unknown"),
      bookings: userBookings.count,
      spend: money(userBookings.spend),
      status,
      risk,
      lastSeen: daysAgo(String(row.last_login_at || row.updated_at || row.created_at || "")),
    };
  });
}

export async function getAdminProviders(): Promise<AdminProvider[]> {
  const [profiles, sellers, kycImages] = await Promise.all([
    maybeRowsWithFallback<AnyRecord>(
      "eloo_profiles",
      "id,role,email,full_name,first_name,last_name,city,is_verified,kyc_status,is_active,created_at",
      "id,role,email,full_name,first_name,last_name,city,is_verified,kyc_status,created_at",
      100
    ),
    maybeRows<AnyRecord>("sellers", "id,email,first_name,last_name,city,service_category,status,id_document_url,selfie_video_url,insurance_document_url,insurance_status,rating,total_jobs,created_at", 100),
    maybeRows<AnyRecord>("user_images", "user_id,image_type,created_at", 1000),
  ]);
  const idCounts = idDocumentCounts(kycImages);

  const merged = new Map<string, AnyRecord>();
  for (const profile of profiles) {
    if (profile.role === "provider") merged.set(String(profile.id), profile);
  }
  for (const seller of sellers) {
    merged.set(String(seller.id), { ...(merged.get(String(seller.id)) || {}), ...seller, role: "provider" });
  }

  const flags = await maybeRowsWhereIn<AnyRecord>(
    "admin_user_flags",
    "user_id,status,risk_override,note,updated_at",
    "user_id",
    Array.from(merged.keys()),
    Math.max(merged.size, 1)
  );
  const flagsByUser = new Map(flags.map((flag) => [String(flag.user_id), flag]));

  return Array.from(merged.values()).map((row) => {
    const id = String(row.id);
    const flagStatus = String(flagsByUser.get(id)?.status || "").toLowerCase();
    const averageRating = Number(row.rating || 0).toFixed(1);

    const hasId = (idCounts.get(id) || 0) >= 2;
    const hasPartialId = Boolean(row.id_document_url || (idCounts.get(id) || 0) > 0);
    const hasSelfie = Boolean(row.selfie_video_url);
    const hasInsurance = Boolean(row.insurance_document_url || row.insurance_status === "approved");
    const submittedDocuments = [hasId ? "ID front/back" : hasPartialId ? "ID one side" : null, hasSelfie ? "selfie video" : null, hasInsurance ? "insurance" : null].filter(Boolean);
    const missingDocuments = [!hasId ? "ID front/back" : null, !hasSelfie ? "selfie video" : null, !hasInsurance ? "insurance" : null].filter(Boolean);
    const docsSubmitted = hasId && hasSelfie && hasInsurance;
    const documentStatus = docsSubmitted ? "Complete" : submittedDocuments.length ? "Partial" : "Not submitted";
    const sellerStatus = String(row.status || "").toLowerCase();
    const profileKycStatus = String(row.kyc_status || "").toLowerCase();
    const isSuspended = sellerStatus === "suspended" || profileKycStatus === "suspended" || flagStatus === "blocked" || row.is_active === false;
    const isRejected = sellerStatus === "rejected";
    const isVerified = !isSuspended && !isRejected && (row.is_verified === true || sellerStatus === "approved");
    const kycStatus = isSuspended ? "Suspended" : isVerified ? "Approved" : isRejected ? "Rejected" : !docsSubmitted || !hasInsurance ? "Missing document" : "Needs review";
    const accountStatus = isVerified ? "Active" : isSuspended || isRejected ? "Blocked" : "Limited";

    return {
      id,
      name: fullName(row),
      service: String(row.service_category || "Not set"),
      city: String(row.city || "Unknown"),
      verification: isVerified ? "Verified" : kycStatus,
      kycStatus,
      documents: [
        submittedDocuments.length ? `Submitted: ${submittedDocuments.join(", ")}` : "Submitted: none",
        missingDocuments.length ? `Missing: ${missingDocuments.join(", ")}` : "Missing: none",
      ].join(" · "),
      docsSubmitted,
      documentStatus,
      rating: averageRating,
      jobs: Number(row.total_jobs || 0),
      accountStatus,
    };
  });
}

export async function getAdminBusinesses(): Promise<AdminBusiness[]> {
  const [businesses, sellerProviders] = await Promise.all([
    maybeRows<AnyRecord>("business_profiles"),
    maybeRows<AnyRecord>(
      "sellers",
      "id,email,first_name,last_name,phone,city,status,service_category,siret,availability,provider_work_mode,can_work_freelance,can_work_shifts,id_document_url,selfie_video_url,insurance_document_url,insurance_status,created_at",
      500
    ),
  ]);

  const rows: Array<AdminBusiness & { createdAtMs: number }> = [
    ...businesses.map((row) => ({
      id: String(row.id || ""),
      name: String(row.business_name || row.legal_name || "Unknown business"),
      kind: "hiring" as const,
      kindLabel: "Hiring business",
      source: "business_profile" as const,
      registrationNumber: String(row.registration_number || "Missing"),
      industry: String(row.industry || "Unknown"),
      city: String(row.city || "Unknown"),
      contact: [row.contact_name, row.contact_email, row.contact_phone].filter(Boolean).map(String).join(" · ") || "Not set",
      document: row.document_url ? String(row.document_source || "Document") : "Missing document",
      docsSubmitted: Boolean(row.document_url),
      status: String(row.status || "pending").toLowerCase(),
      workTypes: readableList(row.typical_work_types),
      created: daysAgo(String(row.created_at || "")),
      createdAtMs: new Date(String(row.created_at || 0)).getTime() || 0,
    })),
    ...sellerProviders.filter(isContractorProvider).map((row) => {
      const accountType = providerAccountType(row);
      const businessName = providerBusinessName(row);
      const canWorkFreelance = row.can_work_freelance === true;
      const canWorkShifts = row.can_work_shifts === true;
      const workModes = [
        canWorkFreelance ? "Freelance jobs" : null,
        canWorkShifts ? "Shift / bulk jobs" : null,
      ].filter(Boolean).join(", ");
      const docsSubmitted = Boolean(row.id_document_url || row.selfie_video_url || row.insurance_document_url || row.insurance_status);

      return {
        id: String(row.id || ""),
        name: businessName || fullName(row),
        kind: "contractor" as const,
        kindLabel: accountType === "agency" ? "Agency / contractor" : "Contractor business",
        source: "provider_account" as const,
        registrationNumber: String(row.siret || "Provider account"),
        industry: String(row.service_category || "Service provider"),
        city: String(row.city || "Unknown"),
        contact: [fullName(row), row.email, row.phone].filter(Boolean).map(String).join(" · ") || "Not set",
        document: docsSubmitted ? "Provider KYC present" : "Provider KYC missing",
        docsSubmitted,
        status: String(row.status || "pending").toLowerCase(),
        workTypes: workModes || titleCase(String(row.provider_work_mode || "freelance")),
        created: daysAgo(String(row.created_at || "")),
        createdAtMs: new Date(String(row.created_at || 0)).getTime() || 0,
      };
    }),
  ];

  return rows
    .sort((left, right) => right.createdAtMs - left.createdAtMs)
    .map(({ createdAtMs, ...business }) => business);
}

export async function getKycReviews(): Promise<KycReview[]> {
  const [sellers, kycImages] = await Promise.all([
    maybeRows<AnyRecord>("sellers", "id,email,first_name,last_name,status,id_document_url,selfie_video_url,insurance_document_url,insurance_status,created_at", 100),
    maybeRows<AnyRecord>("user_images", "user_id,image_type,created_at", 1000),
  ]);
  const idCounts = idDocumentCounts(kycImages);

  return sellers
    .map((row) => {
      const providerId = String(row.id);
      const hasId = (idCounts.get(providerId) || 0) >= 2;
      const hasPartialId = Boolean(row.id_document_url || (idCounts.get(providerId) || 0) > 0);
      const hasSelfie = Boolean(row.selfie_video_url);
      const hasInsurance = Boolean(row.insurance_document_url || row.insurance_status === "approved");
      const submittedDocuments = [hasId ? "ID front/back" : hasPartialId ? "ID one side" : null, hasSelfie ? "selfie video" : null, hasInsurance ? "insurance" : null].filter(Boolean);
      const missingDocuments = [!hasId ? "ID front/back" : null, !hasSelfie ? "selfie video" : null, !hasInsurance ? "insurance" : null].filter(Boolean);
      const docsSubmitted = hasId && hasSelfie && hasInsurance;
      const sellerStatus = String(row.status || "").toLowerCase();
      const isSuspended = sellerStatus === "suspended";
      const isRejected = sellerStatus === "rejected";
      const isVerified = !isSuspended && !isRejected && sellerStatus === "approved";
      const kycStatus = isSuspended ? "Suspended" : isVerified ? "Approved" : isRejected ? "Rejected" : !docsSubmitted || !hasInsurance ? "Missing document" : "Needs review";
      const accountStatus = isVerified ? "Active" : isSuspended || isRejected ? "Blocked" : "Limited";

      return {
        id: `kyc_${String(row.id)}`,
        providerId: String(row.id),
        provider: fullName(row),
        issue: kycStatus,
        document: [
          submittedDocuments.length ? `Submitted: ${submittedDocuments.join(", ")}` : "Submitted: none",
          missingDocuments.length ? `Missing: ${missingDocuments.join(", ")}` : "Missing: none",
        ].join(" · "),
        submittedDocuments: submittedDocuments.map(String),
        missingDocuments: missingDocuments.map(String),
        docsSubmitted,
        priority: kycStatus === "Rejected" || accountStatus === "Blocked" ? "High" : kycStatus === "Needs review" ? "High" : "Medium",
        status: kycStatus,
        submitted: docsSubmitted ? "Submitted" : "Not submitted",
        accountImpact: accountStatus === "Active" ? "No restriction" : `Account ${accountStatus.toLowerCase()}: seller cannot quote`,
      };
    })
    .filter((review) => review.status !== "Approved" || review.accountImpact !== "No restriction");
}

export async function getAdminJobs() {
  const [inquiries, bids, businessPosts, shiftApplications, businesses, profiles, conversations, messages] = await Promise.all([
    maybeRows<AnyRecord>(
      "service_inquiries",
      "id,user_id,first_name,last_name,email,phone,address,city,postal_code,coarse_location_label,category_slug,subcategory_slug,service_type,job_description,job_urgency,preferred_date,preferred_time_start,preferred_time_end,flexible_timing,estimated_duration_hours,number_of_people_needed,budget_range_min,budget_range_max,specific_requirements,equipment_needed,materials_provided,status,created_at,updated_at,submitted_at",
      500
    ),
    maybeRows<AnyRecord>("bids", "*", 1000),
    maybeRows<AnyRecord>(
      "business_work_posts",
      "id,business_id,owner_user_id,work_type,industry,niche,role_title,description,location_name,address,city,postal_code,starts_at,ends_at,headcount,business_preferred_hourly_rate,business_preferred_day_rate,contact_name,contact_phone,status,created_at,updated_at",
      500
    ),
    maybeRows<AnyRecord>("shift_applications", "id,business_work_post_id,status,created_at,updated_at", 1000),
    maybeRows<AnyRecord>("business_profiles", "id,business_name,contact_name,contact_email,contact_phone,city,status,created_at,updated_at", 500),
    maybeRows<AnyRecord>("eloo_profiles", "*", 1000),
    maybeRows<AnyRecord>("eloo_conversations", "*", 1000),
    maybeRows<AnyRecord>("eloo_messages", "id,conversation_id,sender_id,content,is_read,created_at", 2000),
  ]);

  const bidsByInquiry = new Map<string, AnyRecord[]>();
  for (const bid of bids) {
    const inquiryId = String(bid.inquiry_id || "");
    if (!inquiryId) continue;
    const current = bidsByInquiry.get(inquiryId) || [];
    current.push(bid);
    bidsByInquiry.set(inquiryId, current);
  }

  const applicationsByPost = new Map<string, AnyRecord[]>();
  for (const application of shiftApplications) {
    const postId = String(application.business_work_post_id || "");
    if (!postId) continue;
    const current = applicationsByPost.get(postId) || [];
    current.push(application);
    applicationsByPost.set(postId, current);
  }

  const businessesById = new Map(businesses.map((business) => [String(business.id), business]));
  const profilesById = new Map(profiles.map((profile) => [String(profile.id), profile]));
  const conversationsByBidId = new Map<string, AnyRecord[]>();
  for (const conversation of conversations) {
    const bidId = String(conversation.bid_id || "");
    if (!bidId) continue;
    conversationsByBidId.set(bidId, [...(conversationsByBidId.get(bidId) || []), conversation]);
  }

  const messagesByConversationId = new Map<string, AnyRecord[]>();
  for (const message of messages) {
    const conversationId = String(message.conversation_id || "");
    if (!conversationId) continue;
    messagesByConversationId.set(conversationId, [...(messagesByConversationId.get(conversationId) || []), message]);
  }

  const quoteDetailsForBids = (jobBids: AnyRecord[]) =>
    jobBids.map((bid) => {
      const provider = profilesById.get(String(bid.provider_id || "")) || {};
      const amount = Number(bid.amount || 0);
      const breakdown = calculateBookingTokenBreakdown(amount);

      return {
        id: String(bid.id || ""),
        providerId: String(bid.provider_id || ""),
        providerName: fullName(provider) || "Provider",
        providerEmail: String(provider.email || ""),
        providerPhone: String(provider.phone || ""),
        status: String(bid.status || "pending"),
        sellerQuote: money(breakdown.sellerQuote),
        anyJobFee: money(breakdown.bookingToken),
        buyerTotal: money(breakdown.buyerTotal),
        message: String(bid.message || "No quote note added."),
        estimatedDuration: bid.estimated_duration_hours ? `${bid.estimated_duration_hours}h` : "Not provided",
        availableDate: bid.available_date ? compactDateTime(String(bid.available_date)) : "Not provided",
        createdLabel: compactDateTime(String(bid.created_at || "")),
        updatedLabel: compactDateTime(String(bid.updated_at || bid.created_at || "")),
      };
    });

  const chatMessagesForBids = (jobBids: AnyRecord[]) => {
    const acceptedBid = jobBids.find((bid) => String(bid.status || "").toLowerCase() === "accepted");
    if (!acceptedBid) return [];
    const conversation = (conversationsByBidId.get(String(acceptedBid.id || "")) || [])[0];
    if (!conversation) return [];

    return (messagesByConversationId.get(String(conversation.id || "")) || [])
      .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")))
      .map((message) => {
        const senderId = String(message.sender_id || "");
        const sender = profilesById.get(senderId) || {};
        const role = senderId === String(conversation.client_id || "")
          ? "Buyer"
          : senderId === String(conversation.provider_id || "")
            ? "Provider"
            : "Participant";

        return {
          id: String(message.id || ""),
          senderId,
          senderName: fullName(sender),
          senderRole: role,
          content: String(message.content || ""),
          createdLabel: compactDateTime(String(message.created_at || "")),
          isRead: Boolean(message.is_read),
        };
      });
  };

  const inquiryJobs: AdminLiveJob[] = inquiries.map((job) => {
    const id = String(job.id || "");
    const jobBids = bidsByInquiry.get(id) || [];
    const status = String(job.status || "pending_for_review");
    const createdAt = String(job.submitted_at || job.created_at || "");
    const lastBidAt = jobBids
      .map((bid) => String(bid.updated_at || bid.created_at || ""))
      .filter(Boolean)
      .sort()
      .at(-1) || null;
    const lastActivityAt = [String(job.updated_at || ""), lastBidAt || ""].filter(Boolean).sort().at(-1) || createdAt || null;
    const idleDays = lastActivityAt ? Math.max(Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / 86400000), 0) : 0;
    const ageDays = createdAt ? Math.max(Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000), 0) : 0;
    const quoteCount = jobBids.length;
    const acceptedQuote = jobBids.some((bid) => String(bid.status || "").toLowerCase() === "accepted");
    const normalizedStatus = status.toLowerCase();
    const budgetLabel = job.budget_range_min || job.budget_range_max
      ? `${money(Number(job.budget_range_min || 0))} - ${money(Number(job.budget_range_max || 0))}`
      : "Budget not set";
    const scheduleParts = [
      job.preferred_date ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(String(job.preferred_date))) : "",
      [job.preferred_time_start, job.preferred_time_end].filter(Boolean).join(" - "),
      job.flexible_timing ? "Flexible timing" : "",
    ].filter(Boolean);
    const requirementParts = [
      job.specific_requirements,
      job.equipment_needed ? `Equipment: ${job.equipment_needed}` : "",
      job.materials_provided ? "Materials provided by buyer" : "",
    ].filter(Boolean);
    const awaitingBuyer = quoteCount > 0 && !acceptedQuote && ["approved", "submitted", "open", "live"].includes(normalizedStatus);
    const noQuotes = quoteCount === 0;
    const pendingReview = ["pending_for_review", "pending", "draft"].includes(normalizedStatus);
    const moreInfoNeeded = ["more_info_needed", "needs_more_info"].includes(normalizedStatus);
    const rejected = ["rejected", "cancelled"].includes(normalizedStatus);
    const expired = ageDays >= 7 && ["approved", "submitted"].includes(normalizedStatus);
    const tabStatus =
      normalizedStatus === "completed" || normalizedStatus === "converted"
        ? "completed"
        : rejected
          ? "cancelled"
        : normalizedStatus === "expired"
          ? "expired"
          : pendingReview
            ? "pending_review"
          : moreInfoNeeded
            ? "awaiting_buyer"
            : expired
              ? "expired"
              : noQuotes
                ? "no_quotes"
                : awaitingBuyer
                  ? "awaiting_buyer"
                  : "live";

    return {
      id,
      source: "service_inquiry",
      userId: String(job.user_id || ""),
      shortId: id.slice(0, 8),
      datePosted: createdAt,
      postedLabel: createdAt ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(createdAt)) : "Unknown",
      idleDays,
      status,
      sourceLabel: "Buyer service request",
      customer: String([job.first_name, job.last_name].filter(Boolean).join(" ") || job.email || "Client"),
      email: String(job.email || ""),
      phone: String(job.phone || ""),
      address: String(job.address || job.coarse_location_label || "Address not set"),
      town: String(job.city || "Unknown"),
      county: String(job.city || "Unknown"),
      type: String(job.subcategory_slug || job.category_slug || job.service_type || "Service").replaceAll("-", " "),
      description: String(job.job_description || ""),
      schedule: scheduleParts.join(" · ") || "Schedule not set",
      budget: budgetLabel,
      requirements: requirementParts.join(" · ") || "No extra requirements recorded",
      size: job.estimated_duration_hours ? `${job.estimated_duration_hours}h est.` : "Not set",
      beds: job.number_of_people_needed ? String(job.number_of_people_needed) : "-",
      purpose: job.job_urgency ? String(job.job_urgency).replaceAll("_", " ") : job.budget_range_min || job.budget_range_max ? "Quoted budget" : "Service",
      quotes: quoteCount,
      quoteDetails: quoteDetailsForBids(jobBids),
      chatMessages: chatMessagesForBids(jobBids),
      lastActivity: lastActivityAt ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(lastActivityAt)) : "Unknown",
      lastActivityAt,
      tabStatus,
    };
  });

  const businessJobs: AdminLiveJob[] = businessPosts.map((post) => {
    const id = String(post.id || "");
    const postApplications = applicationsByPost.get(id) || [];
    const status = String(post.status || "pending_for_review");
    const normalizedStatus = status.toLowerCase();
    const business = businessesById.get(String(post.business_id || "")) || {};
    const createdAt = String(post.created_at || "");
    const lastApplicationAt = postApplications
      .map((application) => String(application.updated_at || application.created_at || ""))
      .filter(Boolean)
      .sort()
      .at(-1) || null;
    const lastActivityAt = [String(post.updated_at || ""), lastApplicationAt || ""].filter(Boolean).sort().at(-1) || createdAt || null;
    const idleDays = lastActivityAt ? Math.max(Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / 86400000), 0) : 0;
    const ageDays = createdAt ? Math.max(Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000), 0) : 0;
    const applicationCount = postApplications.length;
    const acceptedApplication = postApplications.some((application) => String(application.status || "").toLowerCase() === "accepted");
    const scheduleParts = [
      post.starts_at ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(String(post.starts_at))) : "",
      post.ends_at ? `to ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(String(post.ends_at)))}` : "",
    ].filter(Boolean);
    const rateParts = [
      post.business_preferred_hourly_rate ? `${money(Number(post.business_preferred_hourly_rate))}/hr` : "",
      post.business_preferred_day_rate ? `${money(Number(post.business_preferred_day_rate))}/day` : "",
    ].filter(Boolean);
    const requirementParts = [post.requirements, post.uniform ? `Uniform: ${post.uniform}` : "", post.break_policy ? `Break: ${post.break_policy}` : ""].filter(Boolean);
    const pendingReview = ["pending_for_review", "pending", "draft"].includes(normalizedStatus);
    const moreInfoNeeded = ["more_info_needed", "needs_more_info"].includes(normalizedStatus);
    const rejected = ["rejected", "cancelled"].includes(normalizedStatus);
    const expired = ageDays >= 7 && ["approved", "submitted"].includes(normalizedStatus);
    const tabStatus =
      normalizedStatus === "completed" || normalizedStatus === "filled"
        ? "completed"
          : normalizedStatus === "expired"
            ? "expired"
          : rejected
          ? "cancelled"
          : pendingReview
            ? "pending_review"
          : moreInfoNeeded
            ? "awaiting_buyer"
          : expired
            ? "expired"
            : applicationCount === 0
              ? "no_quotes"
              : !acceptedApplication && ["approved", "submitted"].includes(normalizedStatus)
                ? "awaiting_buyer"
                : "live";

    return {
      id,
      source: "business_work_post",
      userId: String(post.owner_user_id || ""),
      shortId: id.slice(0, 8),
      datePosted: createdAt,
      postedLabel: createdAt ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(createdAt)) : "Unknown",
      idleDays,
      status,
      sourceLabel: "Business shift/work post",
      customer: String(business.business_name || post.contact_name || "Business"),
      email: String(business.contact_email || ""),
      phone: String(post.contact_phone || business.contact_phone || ""),
      address: String(post.address || post.location_name || "Address not set"),
      town: String(post.city || business.city || "Unknown"),
      county: String(post.city || business.city || "Unknown"),
      type: String(post.role_title || post.niche || post.industry || "Shift work").replaceAll("-", " "),
      description: String(post.description || ""),
      schedule: scheduleParts.join(" ") || "Schedule not set",
      budget: rateParts.join(" · ") || "Rate not set",
      requirements: requirementParts.join(" · ") || "No extra requirements recorded",
      size: post.starts_at ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(String(post.starts_at))) : "Not set",
      beds: post.headcount ? String(post.headcount) : "-",
      purpose: String(post.work_type || "Business work").replaceAll("_", " "),
      quotes: applicationCount,
      quoteDetails: postApplications.map((application) => {
        const providerId = String(application.provider_id || application.seller_id || application.worker_id || application.user_id || "");
        const provider = profilesById.get(providerId) || {};
        return {
          id: String(application.id || ""),
          providerId,
          providerName: fullName(provider),
          providerEmail: String(provider.email || ""),
          providerPhone: String(provider.phone || ""),
          status: String(application.status || "pending"),
          sellerQuote: rateParts.join(" · ") || "Rate not set",
          anyJobFee: "Shift wallet",
          buyerTotal: rateParts.join(" · ") || "Rate not set",
          message: String(application.message || application.cover_note || "No application note added."),
          estimatedDuration: scheduleParts.join(" ") || "Shift schedule not set",
          availableDate: application.created_at ? compactDateTime(String(application.created_at)) : "Not provided",
          createdLabel: compactDateTime(String(application.created_at || "")),
          updatedLabel: compactDateTime(String(application.updated_at || application.created_at || "")),
        };
      }),
      chatMessages: [],
      lastActivity: lastActivityAt ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(lastActivityAt)) : "Unknown",
      lastActivityAt,
      tabStatus,
    };
  });

  return [...inquiryJobs, ...businessJobs]
    .sort((a, b) => (b.lastActivityAt || b.datePosted || "").localeCompare(a.lastActivityAt || a.datePosted || ""))
    .slice(0, 300);
}

export async function getAdminOverview() {
  const [profileCount, sellerCount, inquiryCount, bookingCount, reviewCount, bookings, subscriptions, messages, sellers, inquiries, kycImages] = await Promise.all([
    maybeCount("eloo_profiles"),
    maybeCount("sellers"),
    maybeCount("service_inquiries"),
    maybeCount("eloo_bookings"),
    maybeCount("eloo_reviews"),
    maybeRows<AnyRecord>("eloo_bookings", "id,total_price,status,created_at", 25),
    maybeRows<AnyRecord>("eloo_subscriptions", "id,price_monthly,status,created_at", 25),
    maybeRows<AnyRecord>("eloo_messages", "id,content,created_at", 3),
    maybeRows<AnyRecord>("sellers", "id,first_name,last_name,email,status,id_document_url,selfie_video_url,insurance_document_url,insurance_status,created_at", 10),
    maybeRows<AnyRecord>("service_inquiries", "id,job_description,status,created_at", 10),
    maybeRows<AnyRecord>("user_images", "user_id,image_type,created_at", 1000),
  ]);
  const idCounts = idDocumentCounts(kycImages);

  const revenue = bookings.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0) +
    subscriptions.reduce((sum, sub) => sum + Number(sub.price_monthly || 0), 0);
  const openDisputes = inquiries.filter((job) => String(job.status || "").toLowerCase().includes("dispute")).length;
  const activeUserCount = (await getAdminUsers()).filter((user) => user.status === "Active").length;
  const kycQueue = sellers.map((row) => {
    const hasId = (idCounts.get(String(row.id)) || 0) >= 2;
    const hasSelfie = Boolean(row.selfie_video_url);
    const hasInsurance = Boolean(row.insurance_document_url || row.insurance_status === "approved");
    const status = String(row.status || "").toLowerCase();
    const kycStatus = status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : !hasId || !hasSelfie || !hasInsurance ? "Missing document" : "Needs review";
    return { name: fullName(row), kycStatus };
  }).filter((provider) => provider.kycStatus !== "Approved");
  const riskQueueItems = [
    ...kycQueue.map((provider) => ({
      row: [provider.kycStatus === "Rejected" ? "High" : "Medium", "KYC review", provider.name, provider.kycStatus, "Review"],
      href: `/admin/kyc?status=${encodeURIComponent(provider.kycStatus)}`,
    })),
    ...inquiries
      .filter((job) => String(job.status || "").toLowerCase().includes("dispute"))
      .map((job) => ({
        row: ["High", "Job dispute", String(job.job_description || job.id), String(job.status), "Open"],
        href: `/admin/jobs?tab=all&q=${encodeURIComponent(String(job.job_description || job.id))}`,
      })),
  ].slice(0, 10);

  return {
    metrics: [
      { label: "Gross booking value", value: money(revenue), delta: "Live", tone: "text-emerald-700", detail: `Recent ${bookings.length} bookings/subscriptions`, href: "/admin/payments" },
      { label: "Active users", value: String(activeUserCount), delta: "Count", tone: "text-emerald-700", detail: `${profileCount} profile records`, href: "/admin/users?status=Active" },
      { label: "Verified providers", value: String(Math.max(sellerCount - kycQueue.length, 0)), delta: `${kycQueue.length} pending`, tone: kycQueue.length ? "text-amber-700" : "text-emerald-700", detail: `${sellerCount} seller records`, href: "/admin/providers?kyc=Approved" },
      { label: "Open jobs", value: String(inquiryCount + bookingCount), delta: `${openDisputes} disputes`, tone: openDisputes ? "text-red-700" : "text-emerald-700", detail: `${reviewCount} reviews tracked`, href: "/admin/jobs?tab=live" },
    ],
    riskQueue: riskQueueItems.map((item) => item.row),
    riskQueueHrefs: riskQueueItems.map((item) => item.href),
    activity: [
      ...messages.slice(0, 3).map((message) => [daysAgo(String(message.created_at || "")), "Message activity", String(message.content || "").slice(0, 80)]),
      ...bookings.slice(0, 3).map((booking) => [daysAgo(String(booking.created_at || "")), "Booking activity", `${booking.status || "pending"} booking ${String(booking.id).slice(0, 8)}`]),
    ],
  };
}

export async function getAdminAnalytics() {
  const [userCount, providerCount, inquiryCount, bookingCount, reviewCount, bookings, sellers] = await Promise.all([
    maybeCount("eloo_profiles"),
    maybeCount("sellers"),
    maybeCount("service_inquiries"),
    maybeCount("eloo_bookings"),
    maybeCount("eloo_reviews"),
    maybeRows<AnyRecord>("eloo_bookings", "id,status,created_at", 100),
    maybeRows<AnyRecord>("sellers", "id,rating,status,created_at", 100),
  ]);

  const completed = bookings.filter((booking) => booking.status === "completed").length;
  const cancelled = bookings.filter((booking) => booking.status === "cancelled").length;
  const completionRate = bookings.length ? `${Math.round((completed / bookings.length) * 100)}%` : "0%";
  const cancellationRate = bookings.length ? `${Math.round((cancelled / bookings.length) * 100)}%` : "0%";

  return {
    stats: [
      { label: "Users", value: String(userCount), delta: "Count", detail: "Client/admin accounts" },
      { label: "Providers", value: String(providerCount), delta: "Count", detail: "Provider accounts" },
      { label: "Completion rate", value: completionRate, delta: "Live", detail: "Completed bookings" },
      { label: "Reviews", value: String(reviewCount), delta: "Count", detail: "Review records" },
    ],
    rows: [
      ["Total jobs", String(inquiryCount + bookingCount), "Count", "Tracked", "Inspect"],
      ["Completed bookings", String(completed), "Live", "Tracked", "Inspect"],
      ["Cancellation rate", cancellationRate, "Live", cancelled > 0 ? "Needs review" : "Healthy", "Inspect"],
      ["Pending KYC", String(sellers.filter((seller) => String(seller.status || "").toLowerCase() !== "approved").length), "Live", "Needs review", "Inspect"],
      ["Average provider rating", sellers.length ? (sellers.reduce((sum, p) => sum + Number(p.rating || 0), 0) / sellers.length).toFixed(1) : "0.0", "Live", "Tracked", "Inspect"],
    ],
  };
}

export async function getAdminHistory() {
  const [bookings, messages, notifications, actionLogs] = await Promise.all([
    maybeRows<AnyRecord>("eloo_bookings", "id,status,created_at", 50),
    maybeRows<AnyRecord>("eloo_messages", "id,content,created_at", 50),
    maybeRows<AnyRecord>("eloo_notifications", "id,title,type,is_read,created_at", 50),
    maybeRows<AnyRecord>("admin_action_logs", "id,action,target_type,target_id,created_at", 100),
  ]);

  return [
    ...actionLogs.map((log) => [daysAgo(String(log.created_at || "")), "Admin action", `${log.action || "action"} ${log.target_type || ""} ${log.target_id || ""}`.trim(), "Logged", "Open"]),
    ...bookings.map((booking) => [daysAgo(String(booking.created_at || "")), "Booking", `${booking.status || "pending"} booking ${String(booking.id).slice(0, 8)}`, "Logged", "Open"]),
    ...messages.map((message) => [daysAgo(String(message.created_at || "")), "Message", String(message.content || "").slice(0, 80), "Logged", "Open"]),
    ...notifications.map((notification) => [daysAgo(String(notification.created_at || "")), "Notification", String(notification.title || ""), String(notification.is_read ? "Read" : "Unread"), "Open"]),
  ].slice(0, 100);
}

export async function getAdminPayments() {
  const [bookings, shiftEscrows, acceptedBids, legacySubscriptions, providerPlanSubscriptions, buyerPlanSubscriptions] = await Promise.all([
    maybeRows<AnyRecord>("eloo_bookings", "id,total_price,is_paid,status,created_at,updated_at", 100),
    maybeRows<AnyRecord>("shift_escrow_payments", "id,total_charged,agreed_amount,platform_fee,currency,status,payment_reference,paid_at,released_at,created_at,updated_at", 100),
    maybeRows<AnyRecord>("bids", "id,amount,status,accepted_at,created_at,updated_at", 100),
    maybeRows<AnyRecord>("eloo_subscriptions", "id,plan,price_monthly,status,created_at", 100),
    maybeRows<AnyRecord>("provider_plan_subscriptions", "user_id,plan_id,status,current_period_start,current_period_end,started_at,updated_at", 100),
    maybeRows<AnyRecord>("buyer_plan_subscriptions", "user_id,plan_id,status,current_period_start,current_period_end,started_at,updated_at", 100),
  ]);

  return [
    ...bookings.map((booking) => [
      String(booking.id).slice(0, 8),
      "Booking",
      money(Number(booking.total_price || 0)),
      booking.is_paid ? "Paid" : String(booking.status || "Held"),
      "Open",
    ]),
    ...shiftEscrows.map((payment) => [
      String(payment.payment_reference || payment.id || "").slice(0, 12),
      "Shift escrow",
      money(Number(payment.total_charged || payment.agreed_amount || 0)),
      String(payment.status || "requires_payment"),
      "Open",
    ]),
    ...acceptedBids
      .filter((bid) => String(bid.status || "").toLowerCase() === "accepted")
      .map((bid) => {
        const breakdown = calculateBookingTokenBreakdown(Number(bid.amount || 0));
        return [
          String(bid.id).slice(0, 8),
          "Booking token",
          money(Number(breakdown.bookingToken || 0)),
          "Accepted / paid",
          "Open",
        ];
      }),
    ...legacySubscriptions.map((sub) => [
      String(sub.id).slice(0, 8),
      `Legacy subscription ${sub.plan || ""}`.trim(),
      money(Number(sub.price_monthly || 0)),
      String(sub.status || "unknown"),
      "Open",
    ]),
    ...providerPlanSubscriptions.map((sub) => [
      String(sub.user_id || "").slice(0, 8),
      `Provider plan ${sub.plan_id || ""}`.trim(),
      "Configured in Stripe",
      String(sub.status || "unknown"),
      "Open",
    ]),
    ...buyerPlanSubscriptions.map((sub) => [
      String(sub.user_id || "").slice(0, 8),
      `Buyer plan ${sub.plan_id || ""}`.trim(),
      "Configured in Stripe",
      String(sub.status || "unknown"),
      "Open",
    ]),
  ].slice(0, 100);
}

export async function getAdminSupport(): Promise<SupportTicket[]> {
  const supabase = createAdminSupabaseClient() as never as {
    from(table: string): {
      select(columns: string): {
        order(column: string, options?: { ascending?: boolean }): {
          limit(count: number): Promise<{ data: AnyRecord[] | null; error: { message: string } | null }>;
        };
      };
    };
  };

  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(`
        *,
        support_ticket_messages (
          id,
          ticket_id,
          sender_role,
          body,
          internal_note,
          created_at
        )
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return [];

    return (data || [])
      .map(mapSupportTicketRow)
      .sort((left, right) => right.priorityScore - left.priorityScore || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function getAdminReports() {
  const [counts, schedules] = await Promise.all([
    Promise.all([
    maybeCount("eloo_profiles"),
    maybeCount("sellers"),
    maybeCount("service_inquiries"),
    maybeCount("eloo_bookings"),
    maybeCount("eloo_reviews"),
    ]),
    maybeRows<AnyRecord>("admin_report_schedules", "report_type,cadence,recipients,is_active,updated_at", 20),
  ]);
  const operationsSchedule = schedules.find((schedule) => schedule.report_type === "operations");
  const cadence = operationsSchedule ? `${operationsSchedule.cadence || "weekly"} schedule` : "On demand";

  return [
    ["Profiles export", "CSV", `${counts[0]} records · ${cadence}`, "Live", "Download"],
    ["Sellers export", "CSV", `${counts[1]} records · ${cadence}`, "Live", "Download"],
    ["Service inquiries export", "CSV", `${counts[2]} records · ${cadence}`, "Live", "Download"],
    ["Bookings export", "CSV", `${counts[3]} records · ${cadence}`, "Live", "Download"],
    ["Reviews export", "CSV", `${counts[4]} records · ${cadence}`, "Live", "Download"],
  ];
}
