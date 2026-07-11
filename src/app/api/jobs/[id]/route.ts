import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { calculateBookingTokenBreakdown } from "@/lib/booking-token";
import { getBuyerTrustForUsers } from "@/lib/badges/buyer-trust";
import { getProviderStatsMap } from "@/lib/provider-stats";
import { NextRequest, NextResponse } from "next/server";

function coarsePostalCode(postalCode?: string | null) {
  const prefix = postalCode?.trim().slice(0, 3);
  return prefix ? `${prefix} area` : "";
}

type LooseRow = Record<string, any>;

function average(rows: LooseRow[], field = "rating") {
  const values = rows.map((row) => Number(row[field] || 0)).filter((value) => Number.isFinite(value) && value > 0);
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

const categoryLabels: Record<string, string> = {
  menage: "Cleaning",
  bricolage: "Handyman",
  jardinage: "Gardening",
  demenagement: "Moving",
  enfants: "Childcare",
  animaux: "Pet Care",
  informatique: "IT Support",
  "aide-domicile": "Home Help",
  "cours-particuliers": "Private Tutoring",
  hiver: "Winter Services",
  custom: "Custom job request",
};

function readableSlug(slug?: string | null) {
  if (!slug) return "";
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hasMeaningfulText(value?: string | null) {
  return /[\p{L}\p{N}]/u.test(value || "");
}

function jobTitleFromInquiry(job: LooseRow) {
  const description = String(job.job_description || "").trim();
  if (hasMeaningfulText(description)) {
    const [firstBlock] = description.split(/\n\s*\n/);
    return firstBlock.split(/[.!?]/).find((part) => hasMeaningfulText(part))?.trim().slice(0, 90) || firstBlock.trim().slice(0, 90);
  }

  return (
    readableSlug(job.subcategory_slug) ||
    categoryLabels[String(job.category_slug || "")] ||
    readableSlug(job.category_slug) ||
    "Service request"
  );
}

function jobDescriptionFromInquiry(job: LooseRow) {
  const description = String(job.job_description || "").trim();
  if (!hasMeaningfulText(description)) return "No description provided";

  const blocks = description.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  if (blocks.length > 1 && blocks[0].length <= 120) {
    const details = blocks.slice(1).join("\n\n").trim();
    if (hasMeaningfulText(details)) return details;
  }

  return description;
}

// GET: Fetch details for a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // For debugging, let's try to get the user but also allow the query to work without authentication for now
    let user = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      user = userData.user;
    } catch (authError) {
      console.log('Auth error, proceeding without user:', authError);
    }

    // Await params since Next.js 15
    const resolvedParams = await params;
    const jobId = resolvedParams.id;

    const adminSupabase = createAdminSupabaseClient() as any;

    // Check if user has already bid on this job (only if user is authenticated)
    let myBid = null;
    if (user) {
      try {
        const { data: bidData } = await supabase
          .from('bids')
          .select('id, amount, status, created_at')
          .eq('inquiry_id', jobId)
          .eq('provider_id', user.id)
          .single();
        myBid = bidData;
      } catch (bidError) {
        // No bid found, that's okay
        myBid = null;
      }
    }

    // Fetch the specific job inquiry. Accepted jobs may be hidden by row policies,
    // but a provider who owns a bid still needs the detail page for contact unlocks.
    const { data: visibleJob, error } = await supabase
      .from('service_inquiries')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    let job = visibleJob;
    if (!job) {
      const { data: adminJob, error: adminJobError } = await adminSupabase
        .from('service_inquiries')
        .select('*')
        .eq('id', jobId)
        .maybeSingle();

      if (adminJobError) {
        console.error('Admin job fetch error:', adminJobError);
      }
      job = adminJob;
    }

    if (error && !myBid) {
      console.error('Job fetch error:', error);
    }

    if (!job) {
      return NextResponse.json({ error: "Job not found", details: error?.message }, { status: 404 });
    }

    // Get bid count for this job
    const { count: bidCount } = await supabase
      .from('bids')
      .select('*', { count: 'exact', head: true })
      .eq('inquiry_id', jobId);

    // Get work images with the admin client because providers should be able
    // to inspect job photos even when image rows are protected by owner RLS.
    const { data: images, error: imagesError } = await adminSupabase
      .from('user_images')
      .select('id, image_url, public_id, created_at')
      .eq('inquiry_id', jobId)
      .eq('image_type', 'work_image')
      .order('created_at', { ascending: true });

    if (imagesError) {
      console.error('Work image fetch error:', imagesError);
    }

    const imageCount = images?.length || 0;

    const [{ data: bids }, { data: buyerJobs }, { data: buyerReviewsGiven }, { data: buyerReviewsReceived }] = await Promise.all([
      adminSupabase
        .from("bids")
        .select("id,inquiry_id,provider_id,amount,message,estimated_duration_hours,available_date,status,created_at")
        .eq("inquiry_id", jobId)
        .order("created_at", { ascending: false }),
      job.user_id
        ? adminSupabase
            .from("service_inquiries")
            .select("id,status")
            .eq("user_id", job.user_id)
            .limit(1000)
        : Promise.resolve({ data: [] }),
      job.user_id
        ? adminSupabase
            .from("eloo_reviews")
            .select("rating")
            .eq("reviewer_id", job.user_id)
            .limit(1000)
        : Promise.resolve({ data: [] }),
      job.user_id
        ? adminSupabase
            .from("eloo_reviews")
            .select("rating")
            .eq("reviewee_id", job.user_id)
            .eq("review_type", "seller_to_buyer")
            .eq("is_public", true)
            .limit(1000)
        : Promise.resolve({ data: [] }),
    ]);

    const providerIds = Array.from(new Set(((bids || []) as LooseRow[]).map((bid) => String(bid.provider_id || "")).filter(Boolean)));
    const [{ data: providerProfiles }, { data: providerSellers }, providerStatsById] = providerIds.length
      ? await Promise.all([
          adminSupabase
            .from("eloo_profiles")
            .select("id,first_name,last_name,profile_image_url")
            .in("id", providerIds),
          adminSupabase
            .from("sellers")
            .select("id,first_name,last_name,profile_image_url,service_category,experience_level")
            .in("id", providerIds),
          getProviderStatsMap(adminSupabase, providerIds),
        ])
      : [{ data: [] }, { data: [] }, new Map()];

    const profilesById = new Map(((providerProfiles || []) as LooseRow[]).map((profile) => [String(profile.id), profile]));
    const sellersById = new Map(((providerSellers || []) as LooseRow[]).map((seller) => [String(seller.id), seller]));

    const offerDetails = ((bids || []) as LooseRow[]).map((bid) => {
      const providerId = String(bid.provider_id || "");
      const profile = profilesById.get(providerId) || {};
      const seller = sellersById.get(providerId) || {};
      const providerStats = providerStatsById.get(providerId) || { rating: 0, reviewCount: 0, completedJobs: 0, assignedJobs: 0, completionRate: 0 };

      return {
        id: String(bid.id),
        providerId,
        amount: Number(bid.amount || 0),
        buyerTotal: calculateBookingTokenBreakdown(Number(bid.amount || 0)).buyerTotal,
        message: String(bid.message || ""),
        estimatedDurationHours: bid.estimated_duration_hours ? Number(bid.estimated_duration_hours) : null,
        availableDate: bid.available_date || null,
        status: String(bid.status || "pending"),
        createdAt: bid.created_at,
        provider: {
          name: [seller.first_name || profile.first_name, seller.last_name || profile.last_name].filter(Boolean).join(" ") || "Provider",
          avatar: seller.profile_image_url || profile.profile_image_url || null,
          rating: providerStats.rating,
          reviewCount: providerStats.reviewCount,
          totalJobs: providerStats.completedJobs,
          completionRate: providerStats.completionRate,
          serviceCategory: seller.service_category || null,
          experienceLevel: seller.experience_level || null,
        },
      };
    });

    const buyerRows = (buyerJobs || []) as LooseRow[];
    const hiredStatuses = new Set(["bid_accepted", "confirmed", "in_progress", "completed", "converted"]);
    const buyerPostedJobs = buyerRows.length;
    const buyerHiredJobs = buyerRows.filter((row) => hiredStatuses.has(String(row.status || "").toLowerCase())).length;
    const buyerStats = {
      jobsPosted: buyerPostedJobs,
      hires: buyerHiredJobs,
      hireRate: buyerPostedJobs ? Math.round((buyerHiredJobs / buyerPostedJobs) * 100) : 0,
      averageRatingGiven: average((buyerReviewsGiven || []) as LooseRow[]),
      ratingsGiven: ((buyerReviewsGiven || []) as LooseRow[]).length,
    };
    const buyerReceivedReviewRows = (buyerReviewsReceived || []) as LooseRow[];
    const buyerReceivedReviewCount = buyerReceivedReviewRows.length;
    const buyerReceivedRating = average(buyerReceivedReviewRows);
    const buyerTrust = job.user_id
      ? (await getBuyerTrustForUsers(adminSupabase, [String(job.user_id)])).get(String(job.user_id)) || null
      : null;

    const showContact = myBid?.status === 'accepted';
    const coarseLabel = job.coarse_location_label || [job.city, coarsePostalCode(job.postal_code)].filter(Boolean).join(', ');

    // Transform the data to match the expected format
    const transformedJob = {
      id: job.id,
      title: jobTitleFromInquiry(job),
      description: jobDescriptionFromInquiry(job),
      client: {
        name: `${job.first_name} ${job.last_name}`,
        email: user && showContact ? job.email : undefined, // Only after bid accepted
        phone: user && showContact ? job.phone : undefined, // Only after bid accepted
        photo: undefined,
        rating: buyerReceivedReviewCount ? buyerReceivedRating : undefined,
        reviewCount: buyerReceivedReviewCount || undefined
      },
      budget: {
        min: parseFloat(job.budget_range_min) || 0,
        max: parseFloat(job.budget_range_max) || 0,
        currency: "€"
      },
      location: {
        address: showContact ? (job.address || 'Address not provided') : (coarseLabel || 'Approximate location only'),
        city: job.city || 'Unknown',
        postalCode: showContact ? (job.postal_code || '') : coarsePostalCode(job.postal_code),
        coarseLabel,
        latitude: showContact ? job.latitude : job.coarse_latitude,
        longitude: showContact ? job.longitude : job.coarse_longitude,
        exactAddressVisible: showContact
      },
      category: job.category_slug || 'general',
      customTags: job.custom_tags || [],
      serviceType: job.service_type || 'One time',
      urgency: job.job_urgency || 'medium',
      duration: job.estimated_duration_hours ? `${job.estimated_duration_hours} hours` : 'Not specified',
      peopleNeeded: job.number_of_people_needed || 1,
      date: job.preferred_date ? new Date(job.preferred_date).toLocaleDateString() : 'Flexible',
      startTime: job.preferred_time_start ? job.preferred_time_start.slice(0, 5) : 'Not specified',
      endTime: job.preferred_time_end ? job.preferred_time_end.slice(0, 5) : 'Not specified',
      materials: job.materials_provided ? 'Client provides materials' : 'Provider should bring materials',
      equipment: job.equipment_needed || 'No specific equipment needed',
      postedAt: new Date(job.submitted_at).toLocaleDateString(),
      status: job.status || 'submitted',
      bid_count: bidCount || 0,
      my_bid: myBid,
      work_image_count: imageCount,
      work_images: images || [],
      offers: offerDetails,
      buyerStats,
      buyerTrust,
    };

    return NextResponse.json({ job: transformedJob });
  } catch (error) {
    console.error('Error fetching job details:', error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch job details", details: message }, { status: 500 });
  }
}
