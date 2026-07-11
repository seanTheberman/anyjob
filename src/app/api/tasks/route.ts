import { calculateBookingTokenBreakdown } from "@/lib/booking-token";
import { getBuyerTrustForUsers } from "@/lib/badges/buyer-trust";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

type Row = Record<string, any>;

function coarsePostalCode(postalCode?: string | null) {
  const prefix = postalCode?.trim().slice(0, 3);
  return prefix ? `${prefix} area` : "";
}

function categoryLabel(value?: string | null) {
  return String(value || "General").replaceAll("-", " ");
}

function hasMeaningfulText(value?: string | null) {
  return /[\p{L}\p{N}]/u.test(value || "");
}

function splitStoredJobDescription(value?: string | null) {
  const text = String(value || "").trim();
  if (!hasMeaningfulText(text)) return { title: "", description: "" };

  const blocks = text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  if (blocks.length > 1 && blocks[0].length <= 120) {
    return {
      title: blocks[0],
      description: blocks.slice(1).join("\n\n"),
    };
  }

  const firstSentence = text.split(/[.!?]/).find((part) => hasMeaningfulText(part))?.trim();
  return {
    title: (firstSentence || text).slice(0, 120),
    description: text,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase() || "";
    const category = searchParams.get("category") || "";
    const location = searchParams.get("location")?.trim().toLowerCase() || "";
    const price = searchParams.get("price") || "";
    const sort = searchParams.get("sort") || "newest";
    const remoteOnly = searchParams.get("remote") === "true";

    const admin = createAdminSupabaseClient() as never as { from(table: string): any };
    const [inquiriesResult, businessPostsResult, bidsResult, imagesResult] = await Promise.all([
      admin
        .from("service_inquiries")
        .select("id,user_id,category_slug,subcategory_slug,service_type,job_description,city,postal_code,coarse_location_label,budget_range_min,budget_range_max,preferred_date,status,submitted_at,created_at")
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(100),
      admin
        .from("business_work_posts")
        .select("id,work_type,industry,niche,role_title,description,city,postal_code,starts_at,business_preferred_hourly_rate,business_preferred_day_rate,status,created_at")
        .eq("status", "submitted")
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("bids")
        .select("id,inquiry_id,amount,status"),
      admin
        .from("user_images")
        .select("id,inquiry_id,image_url,created_at")
        .eq("image_type", "work_image")
        .order("created_at", { ascending: true }),
    ]);

    if (inquiriesResult.error || businessPostsResult.error || bidsResult.error || imagesResult.error) {
      return NextResponse.json(
        { error: inquiriesResult.error?.message || businessPostsResult.error?.message || bidsResult.error?.message || imagesResult.error?.message },
        { status: 500 }
      );
    }

    const bidsByInquiry = new Map<string, Row[]>();
    for (const bid of (bidsResult.data || []) as Row[]) {
      const inquiryId = String(bid.inquiry_id || "");
      if (!inquiryId) continue;
      bidsByInquiry.set(inquiryId, [...(bidsByInquiry.get(inquiryId) || []), bid]);
    }

    const imagesByInquiry = new Map<string, Row[]>();
    for (const image of (imagesResult.data || []) as Row[]) {
      const inquiryId = String(image.inquiry_id || "");
      if (!inquiryId) continue;
      imagesByInquiry.set(inquiryId, [...(imagesByInquiry.get(inquiryId) || []), image]);
    }

    const buyerIds = Array.from(new Set(((inquiriesResult.data || []) as Row[]).map((job) => String(job.user_id || "")).filter(Boolean)));
    const buyerTrustByUser = await getBuyerTrustForUsers(admin, buyerIds);

    const buyerTasks = ((inquiriesResult.data || []) as Row[]).map((job) => {
      const storedDescription = splitStoredJobDescription(job.job_description);
      const bids = bidsByInquiry.get(String(job.id)) || [];
      const workImages = (imagesByInquiry.get(String(job.id)) || []).map((image) => ({
        id: String(image.id),
        image_url: String(image.image_url || ""),
      })).filter((image) => image.image_url);
      const lowestBid = bids.reduce<Row | null>((lowest, bid) => {
        if (!lowest) return bid;
        return Number(bid.amount || 0) < Number(lowest.amount || 0) ? bid : lowest;
      }, null);
      return {
        id: String(job.id),
        source: "buyer",
        title: storedDescription.title || categoryLabel(job.subcategory_slug || job.category_slug),
        category: String(job.category_slug || "general"),
        description: storedDescription.description || String(job.job_description || ""),
        location: job.coarse_location_label || [job.city, coarsePostalCode(job.postal_code)].filter(Boolean).join(", ") || "Remote or approximate area",
        remote: false,
        priceMin: Number(job.budget_range_min || 0),
        priceMax: Number(job.budget_range_max || 0),
        quoteCount: bids.length,
        lowestQuoteTotal: lowestBid ? calculateBookingTokenBreakdown(Number(lowestBid.amount || 0)).buyerTotal : null,
        startsAt: job.preferred_date || null,
        createdAt: job.submitted_at || job.created_at,
        href: `/pro/jobs/${job.id}`,
        workImages,
        buyerTrust: buyerTrustByUser.get(String(job.user_id || "")) || null,
      };
    });

    const businessTasks = ((businessPostsResult.data || []) as Row[]).map((post) => {
      const hourly = Number(post.business_preferred_hourly_rate || 0);
      const day = Number(post.business_preferred_day_rate || 0);
      return {
        id: String(post.id),
        source: "business",
        title: String(post.role_title || categoryLabel(post.niche)),
        category: String(post.niche || post.industry || "business"),
        description: String(post.description || ""),
        location: [post.city, coarsePostalCode(post.postal_code)].filter(Boolean).join(", ") || "Approximate business area",
        remote: post.work_type === "freelance_service",
        priceMin: hourly || day || 0,
        priceMax: day || hourly || 0,
        quoteCount: 0,
        lowestQuoteTotal: null,
        startsAt: post.starts_at || null,
        createdAt: post.created_at,
        href: "/pro/shifts",
      };
    });

    let tasks = [...buyerTasks, ...businessTasks];

    if (query) {
      tasks = tasks.filter((task) => [task.title, task.description, task.category, task.location].join(" ").toLowerCase().includes(query));
    }
    if (category) {
      tasks = tasks.filter((task) => task.category === category);
    }
    if (location) {
      tasks = tasks.filter((task) => task.location.toLowerCase().includes(location) || (remoteOnly && task.remote));
    }
    if (price) {
      const [minRaw, maxRaw] = price.split("-");
      const min = Number(minRaw || 0);
      const max = maxRaw === "plus" ? Number.POSITIVE_INFINITY : Number(maxRaw || 0);
      tasks = tasks.filter((task) => {
        const taskPrice = task.lowestQuoteTotal || task.priceMax || task.priceMin || 0;
        return taskPrice >= min && taskPrice <= max;
      });
    }

    tasks.sort((a, b) => {
      if (sort === "price_low") return (a.lowestQuoteTotal || a.priceMin || 0) - (b.lowestQuoteTotal || b.priceMin || 0);
      if (sort === "price_high") return (b.lowestQuoteTotal || b.priceMax || 0) - (a.lowestQuoteTotal || a.priceMax || 0);
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });

    const categories = Array.from(new Set(tasks.map((task) => task.category))).sort();
    return NextResponse.json({ tasks, categories });
  } catch (error) {
    console.error("Tasks lookup failed:", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}
