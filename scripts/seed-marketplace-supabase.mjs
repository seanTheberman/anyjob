import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!key || process.env[key]) continue;
    process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const seededProviders = [
  {
    matchEmail: "fee-provider-1780821915840@anyjob.test",
    first_name: "Fee",
    last_name: "Provider",
    service_category: "Cleaning",
    experience_level: "Level 2",
    city: "Paris",
    hourly_rate: 25,
    total_jobs: 18,
    availability: { marketplaceAvailability: "Today", note: "Available today in central Paris", responseTime: "1h avg response" },
    profile_image_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop",
    description: "Manual fee flow provider with recurring apartment cleaning, move-out refreshes, and same-day tidy-ups in Paris.",
    portfolio: [
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1563453392212-326f5e854473?q=80&w=1200&auto=format&fit=crop",
    ],
    reviews: [
      { rating: 5, comment: "Arrived on time, brought the right supplies, and left the apartment ready for guests." },
      { rating: 5, comment: "Clear communication and a very careful deep clean before our move-out inspection." },
      { rating: 4, comment: "Good result and easy to coordinate. I would book again for a longer slot." },
    ],
    badges: ["Verified ID", "Level 2", "Fast Responder"],
  },
  {
    matchEmail: "shift-provider-1780819482633@anyjob.test",
    first_name: "Shift",
    last_name: "Worker",
    service_category: "Healthcare",
    experience_level: "Level 2",
    city: "Paris",
    hourly_rate: 25,
    total_jobs: 12,
    availability: { marketplaceAvailability: "This week", note: "Available for weekday healthcare support", responseTime: "2h avg response" },
    profile_image_url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1200&auto=format&fit=crop",
    description: "Approved healthcare shift worker for home support, patient assistance, and short-notice care coverage.",
    portfolio: [
      "https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1200&auto=format&fit=crop",
    ],
    reviews: [
      { rating: 5, comment: "Professional and calm with my father. The handover notes were detailed and useful." },
      { rating: 4, comment: "Reliable healthcare support and very respectful in the home." },
    ],
    badges: ["Verified ID", "Level 2"],
  },
  {
    matchEmail: "qa-seller-real-1780645202495@example.com",
    first_name: "QAReal",
    last_name: "Seller",
    service_category: "Cleaning",
    experience_level: "Level 1",
    city: "Paris",
    hourly_rate: 32,
    total_jobs: 7,
    availability: { marketplaceAvailability: "Weekends", note: "Weekend cleaning slots available", responseTime: "3h avg response" },
    profile_image_url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1200&auto=format&fit=crop",
    description: "Five years of cleaning experience with verified references and flexible weekend availability in Paris.",
    portfolio: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1200&auto=format&fit=crop",
    ],
    reviews: [
      { rating: 5, comment: "Excellent kitchen and bathroom clean. The booking matched exactly what was promised." },
    ],
    badges: ["Verified ID", "Level 1"],
  },
  {
    matchEmail: "pro-profile-playwright@anyjob.com",
    first_name: "Playwright",
    last_name: "Provider",
    service_category: "Handyman",
    experience_level: "Level 1",
    city: "Paris",
    hourly_rate: 88,
    total_jobs: 4,
    availability: { marketplaceAvailability: "Remote", note: "Remote estimates and Paris appointments", responseTime: "4h avg response" },
    profile_image_url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=1200&auto=format&fit=crop",
    description: "Handyman profile used for verified end-to-end testing with real Supabase-backed public profile fields.",
    portfolio: [
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=1200&auto=format&fit=crop",
    ],
    reviews: [
      { rating: 5, comment: "Quick diagnosis and a tidy repair. The provider kept the estimate clear." },
    ],
    badges: ["Verified ID", "Level 1"],
  },
];

const defaultBadgeDetails = {
  "Verified ID": "Provider identity or verification status has been approved.",
  "Level 1": "Provider has completed initial marketplace work with public feedback.",
  "Level 2": "Provider has a stronger completion history and public feedback.",
  "Top Pro": "Provider has excellent public reviews and a high completion history.",
  "Fast Responder": "Provider has a short response-time field on their marketplace profile.",
};

async function ensureBadgeDefinitions() {
  const names = Array.from(new Set(seededProviders.flatMap((provider) => provider.badges)));
  const { data: existing, error: existingError } = await supabase
    .from("badge_definitions")
    .select("id,name")
    .in("name", names);

  if (existingError) throw existingError;

  const byName = new Map((existing || []).map((row) => [row.name, row.id]));
  const missing = names
    .filter((name) => !byName.has(name))
    .map((name) => ({
      name,
      description: defaultBadgeDetails[name] || "Seeded marketplace badge.",
      icon: name.includes("Level") ? "Star" : name === "Verified ID" ? "ShieldCheck" : "Award",
      color: name === "Verified ID" ? "emerald" : name.includes("Level") ? "blue" : "red",
      is_active: true,
    }));

  if (missing.length) {
    const { data: inserted, error } = await supabase
      .from("badge_definitions")
      .insert(missing)
      .select("id,name");
    if (error) throw error;
    for (const row of inserted || []) byName.set(row.name, row.id);
  }

  return byName;
}

async function seedMarketplace() {
  const { data: sellers, error: sellerError } = await supabase
    .from("sellers")
    .select("id,email")
    .in("email", seededProviders.map((provider) => provider.matchEmail));

  if (sellerError) throw sellerError;

  const sellersByEmail = new Map((sellers || []).map((seller) => [seller.email, seller.id]));
  const reviewerProfiles = await supabase
    .from("eloo_profiles")
    .select("id,first_name,last_name,role")
    .eq("role", "client")
    .limit(6);

  if (reviewerProfiles.error) throw reviewerProfiles.error;
  if (!reviewerProfiles.data?.length) throw new Error("No client eloo_profiles found for seeded reviews.");

  const badgeIdsByName = await ensureBadgeDefinitions();
  const seededProviderIds = seededProviders
    .map((provider) => sellersByEmail.get(provider.matchEmail))
    .filter(Boolean);

  if (seededProviderIds.length) {
    await supabase.from("user_images").delete().like("public_id", "seed/marketplace/%").in("user_id", seededProviderIds);
    await supabase.from("eloo_reviews").delete().like("comment", "Seeded marketplace review:%").in("reviewee_id", seededProviderIds);
    await supabase.from("provider_badges").delete().like("awarded_reason", "Seeded marketplace data%").in("provider_id", seededProviderIds);
  }

  let reviewCursor = 0;

  for (const provider of seededProviders) {
    const providerId = sellersByEmail.get(provider.matchEmail);
    if (!providerId) {
      console.warn(`Skipping ${provider.matchEmail}: seller not found.`);
      continue;
    }

    const averageRating = provider.reviews.length
      ? Math.round((provider.reviews.reduce((sum, review) => sum + review.rating, 0) / provider.reviews.length) * 10) / 10
      : 0;

    const { error: updateError } = await supabase
      .from("sellers")
      .update({
        first_name: provider.first_name,
        last_name: provider.last_name,
        service_category: provider.service_category,
        experience_level: provider.experience_level,
        city: provider.city,
        country: "France",
        hourly_rate: provider.hourly_rate,
        total_jobs: provider.total_jobs,
        rating: averageRating,
        availability: provider.availability,
        profile_image_url: provider.profile_image_url,
        description: provider.description,
      })
      .eq("id", providerId);

    if (updateError) throw updateError;

    const imageRows = provider.portfolio.map((imageUrl, index) => ({
      user_id: providerId,
      image_url: imageUrl,
      public_id: `seed/marketplace/${providerId}/portfolio-${index + 1}`,
      image_type: "portfolio",
      title: `${provider.service_category} portfolio ${index + 1}`,
      description: "Seeded marketplace portfolio image stored in Supabase user_images.",
      display_order: index,
    }));

    if (imageRows.length) {
      const { error } = await supabase.from("user_images").insert(imageRows);
      if (error) throw error;
    }

    const reviewRows = provider.reviews.map((review) => {
      const reviewer = reviewerProfiles.data[reviewCursor % reviewerProfiles.data.length];
      reviewCursor += 1;
      return {
        reviewer_id: reviewer.id,
        reviewee_id: providerId,
        rating: review.rating,
        comment: `Seeded marketplace review: ${review.comment}`,
        is_public: true,
      };
    });

    if (reviewRows.length) {
      const { error } = await supabase.from("eloo_reviews").insert(reviewRows);
      if (error) throw error;
    }

    const badgeRows = provider.badges
      .map((name) => badgeIdsByName.get(name))
      .filter(Boolean)
      .map((badgeId) => ({
        provider_id: providerId,
        badge_id: badgeId,
        awarded_reason: "Seeded marketplace data for Supabase-backed UI verification",
      }));

    if (badgeRows.length) {
      const { error } = await supabase.from("provider_badges").insert(badgeRows);
      if (error) throw error;
    }
  }
}

seedMarketplace()
  .then(() => {
    console.log("Seeded Supabase marketplace media, reviews, and badges.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
