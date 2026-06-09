import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ProviderCardData = {
  id: string;
  slug: string;
  name: string;
  category: string;
  rate: number;
  image: string | null;
  isNew?: boolean;
  tags: string[];
};

export type ProviderMarketplaceData = ProviderCardData & {
  city: string;
  country: string;
  location: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  level: string;
  badges: string[];
  availability: string;
  responseTime: string;
  description: string;
  services: string[];
  searchText: string;
  categorySlug: string;
  heroImage: string | null;
};

export type ProviderProfileData = {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  heroImage: string | null;
  profileVideo: {
    url: string;
    thumbnailUrl: string;
  } | null;
  avatar: string | null;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  level: ProviderMarketplaceData["level"];
  badges: string[];
  rate: number;
  email: string;
  phone: string;
  location: string;
  experience: string;
  biography: string;
  services: string[];
  responseTime: string;
  hourlyRate: string;
  availability: string;
  photos: string[];
  highlights: string[];
  reviewDistribution: Record<number, number>;
  writtenReviews: ProviderWrittenReview[];
  relatedProviders: ProviderMarketplaceData[];
};

export type ProviderWrittenReview = {
  id: string;
  reviewerName: string;
  reviewerInitials: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type SellerRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  profile_image_url: string | null;
  city: string | null;
  country: string | null;
  service_category: string | null;
  experience_level: string | null;
  description: string | null;
  hourly_rate: number | null;
  status: string | null;
  rating: number | null;
  total_jobs: number | null;
  availability?: unknown;
  created_at: string | null;
};

type RatingStats = {
  rating: number;
  reviewCount: number;
  distribution: Record<number, number>;
};

type ProviderMedia = {
  heroImage: string | null;
  portfolioPhotos: string[];
  profileVideo: ProviderProfileData["profileVideo"];
};

type BadgeAwardRow = {
  provider_id: string | null;
  badge_id: string | null;
};

type BadgeDefinitionRow = {
  id: string;
  name: string | null;
  is_active: boolean | null;
};

type SellersSupabaseClient = {
  from(table: "sellers"): {
    select(columns: string): {
      eq(column: string, value: string): SellersQuery;
    };
  };
};

type UserImagesSupabaseClient = {
  from(table: "user_images"): {
    select(columns: string): any;
  };
};

type ReviewsSupabaseClient = {
  from(table: "eloo_reviews"): {
    select(columns: string): {
      eq(column: string, value: string): {
        eq(column: string, value: boolean): {
          order(column: string, options: { ascending: boolean }): {
            limit(count: number): Promise<{ data: ReviewRow[] | null; error: { message: string } | null }>;
          };
        };
      };
    };
  };
};

type SellersQuery = {
  eq(column: string, value: string): SellersQuery;
  order(column: string, options: { ascending: boolean }): Promise<{ data: SellerRow[] | null; error: { message: string } | null }>;
  maybeSingle(): Promise<{ data: SellerRow | null; error: { message: string } | null }>;
};

type UserImageRow = {
  user_id?: string | null;
  image_url: string | null;
  image_type?: string | null;
  description?: string | null;
};

type ReviewRow = {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  reviewer_id: string | null;
  reviewer?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

const CATEGORY_ALIASES: Record<string, string[]> = {
  "aide-domicile": ["home help", "home care", "aide domicile", "aide-domicile", "assistance", "healthcare"],
  animaux: ["pet", "pets", "animal", "animaux", "dog", "cat"],
  bricolage: ["handyman", "bricolage", "diy", "repair", "painting", "plumbing", "electrical"],
  "cours-particuliers": ["tutor", "tutoring", "teacher", "cours", "education", "lessons"],
  demenagement: ["moving", "mover", "demenagement", "déménagement", "transport"],
  enfants: ["child", "children", "childcare", "babysitter", "babysitting", "enfants"],
  hiver: ["winter", "hiver", "snow", "seasonal"],
  informatique: ["it", "tech", "computer", "informatique", "wifi", "software"],
  jardinage: ["garden", "gardening", "jardinage", "landscaping"],
  menage: ["cleaning", "cleaner", "menage", "ménage", "housekeeping"],
};

function normalize(value: string | null | undefined) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function providerName(provider: SellerRow) {
  return [provider.first_name, provider.last_name].filter(Boolean).join(" ").trim() || "Provider";
}

function categorySlugFor(category: string | null | undefined) {
  const normalizedCategory = normalize(category);
  const entry = Object.entries(CATEGORY_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => normalizedCategory.includes(normalize(alias))),
  );

  return entry?.[0] || "search";
}

function providerMatchesCategory(provider: SellerRow, categorySlug?: string) {
  if (!categorySlug) return true;

  const aliases = CATEGORY_ALIASES[categorySlug] || [categorySlug];
  const category = normalize(provider.service_category);

  return aliases.some((alias) => category.includes(normalize(alias)));
}

function serviceTags(provider: SellerRow) {
  return [
    provider.service_category,
    provider.experience_level,
    provider.city,
  ].filter((tag): tag is string => Boolean(tag && tag.trim()));
}

function initialsForName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "C";
}

function providerAvailabilityLabel(provider: SellerRow) {
  const availability = provider.availability as { marketplaceAvailability?: string; note?: string } | null;
  if (availability?.note && availability.note.trim()) return availability.note.trim();
  if (availability?.marketplaceAvailability && availability.marketplaceAvailability.trim()) return availability.marketplaceAvailability.trim();
  return "";
}

function providerResponseTime(provider: SellerRow) {
  const availability = provider.availability as { responseTime?: string; response_time?: string } | null;
  return availability?.responseTime?.trim() || availability?.response_time?.trim() || "";
}

function providerLevelFromBadges(badges: string[]) {
  return badges.find((badge) => ["Top Pro", "Level 2", "Level 1"].includes(badge)) || "";
}

function serviceList(provider: SellerRow) {
  return serviceTags(provider).filter((value, index, array) => value && array.indexOf(value) === index);
}

function mapSellerToCard(provider: SellerRow): ProviderCardData {
  return {
    id: provider.id,
    slug: provider.id,
    name: providerName(provider),
    category: provider.service_category || "Service provider",
    rate: provider.hourly_rate && provider.hourly_rate > 0 ? provider.hourly_rate : 0,
    image: provider.profile_image_url || null,
    isNew: Number(provider.total_jobs || 0) === 0,
    tags: serviceTags(provider),
  };
}

function mapSellerToMarketplace(
  provider: SellerRow,
  media?: ProviderMedia,
  ratingStats?: RatingStats,
  badges: string[] = [],
): ProviderMarketplaceData {
  const category = provider.service_category || "Service provider";
  const categorySlug = categorySlugFor(category);
  const services = serviceList(provider);
  const rate = provider.hourly_rate && provider.hourly_rate > 0 ? provider.hourly_rate : 0;
  const city = provider.city || "";
  const country = provider.country || "";
  const rating = ratingStats?.rating || 0;
  const reviewCount = ratingStats?.reviewCount || 0;
  const level = providerLevelFromBadges(badges);
  const availability = providerAvailabilityLabel(provider);
  const tags = [
    level,
    availability,
    ...badges,
    ...serviceTags(provider),
  ].filter((value, index, array) => value && array.indexOf(value) === index);
  const description = provider.description || "";
  const heroImage = media?.heroImage || provider.profile_image_url || null;
  const searchText = [
    providerName(provider),
    category,
    city,
    country,
    description,
    provider.experience_level,
    level,
    availability,
    ...badges,
    ...services,
  ].filter(Boolean).join(" ").toLowerCase();

  return {
    ...mapSellerToCard(provider),
    category,
    categorySlug,
    city,
    country,
    location: [city, country].filter(Boolean).join(", "),
    rating,
    reviewCount,
    completedJobs: Number(provider.total_jobs || 0),
    level,
    badges,
    availability,
    responseTime: providerResponseTime(provider),
    description,
    services,
    searchText,
    heroImage,
    tags,
  };
}

function mapReviewRows(rows: ReviewRow[], provider: SellerRow): ProviderWrittenReview[] {
  return rows
    .filter((review) => review.comment && review.comment.trim())
    .map((review, index) => {
      const name = [review.reviewer?.first_name, review.reviewer?.last_name?.[0] ? `${review.reviewer.last_name[0]}.` : ""].filter(Boolean).join(" ") || `Client ${index + 1}`;
      return {
        id: review.id,
        reviewerName: name,
        reviewerInitials: initialsForName(name),
        rating: Number(review.rating || provider.rating || 5),
        comment: review.comment?.trim() || "",
        createdAt: review.created_at ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(review.created_at)) : "Verified booking",
      };
    });
}

function parseMediaDescription(description?: string | null) {
  if (!description) return {};
  try {
    const parsed = JSON.parse(description) as { thumbnailUrl?: unknown; thumbnailSecond?: unknown };
    return {
      thumbnailUrl: typeof parsed.thumbnailUrl === "string" ? parsed.thumbnailUrl : undefined,
      thumbnailSecond: typeof parsed.thumbnailSecond === "number" && Number.isFinite(parsed.thumbnailSecond) ? parsed.thumbnailSecond : undefined,
    };
  } catch {
    return {};
  }
}

function cloudinaryVideoThumbnail(videoUrl: string, seconds = 0) {
  if (!videoUrl.includes("/upload/")) return "";
  const cleanSecond = Math.max(0, Math.round(seconds * 10) / 10);
  const transformedUrl = videoUrl.replace("/upload/", `/upload/so_${cleanSecond},f_jpg/`);
  return transformedUrl.replace(/\.(mp4|webm|mov)(\?.*)?$/i, ".jpg$2");
}

function videoThumbnailFor(row: UserImageRow | null | undefined) {
  if (!row?.image_url) return "";
  const metadata = parseMediaDescription(row.description);
  return metadata.thumbnailUrl || cloudinaryVideoThumbnail(row.image_url, metadata.thumbnailSecond || 0);
}

function mapSellerToProfile(
  provider: SellerRow,
  media: ProviderMedia,
  ratingStats: RatingStats,
  writtenReviews: ProviderWrittenReview[] = [],
  relatedProviders: ProviderMarketplaceData[] = [],
  badges: string[] = [],
): ProviderProfileData {
  const category = provider.service_category || "Service provider";
  const categorySlug = categorySlugFor(category);
  const rate = provider.hourly_rate && provider.hourly_rate > 0 ? provider.hourly_rate : 0;
  const location = [provider.city, provider.country].filter(Boolean).join(", ") || "Location not provided";
  const serviceList = serviceTags(provider);
  const heroImage = media.heroImage || provider.profile_image_url || null;
  const rating = ratingStats.rating;
  const completedJobs = Number(provider.total_jobs || 0);

  return {
    id: provider.id,
    name: providerName(provider),
    category,
    categorySlug,
    heroImage,
    profileVideo: media.profileVideo,
    avatar: provider.profile_image_url || null,
    rating,
    reviewCount: ratingStats.reviewCount,
    completedJobs,
    level: providerLevelFromBadges(badges),
    badges,
    rate,
    email: provider.email || "",
    phone: provider.phone || "",
    location,
    experience: provider.experience_level || "",
    biography: provider.description || "",
    services: serviceList,
    responseTime: providerResponseTime(provider),
    hourlyRate: rate ? `From $${rate} / hour` : "Rate not set",
    availability: providerAvailabilityLabel(provider),
    photos: [heroImage, ...media.portfolioPhotos].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index),
    highlights: badges,
    reviewDistribution: ratingStats.distribution,
    writtenReviews,
    relatedProviders,
  };
}

async function getApprovedSellers() {
  const supabase = createAdminSupabaseClient() as unknown as SellersSupabaseClient;
  const { data, error } = await supabase
    .from("sellers")
    .select("id,email,first_name,last_name,phone,profile_image_url,city,country,service_category,experience_level,description,hourly_rate,status,rating,total_jobs,availability,created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load real providers:", error.message);
    return [];
  }

  return (data || []) as SellerRow[];
}

export async function getProviderCards(categorySlug?: string) {
  const providers = await getApprovedSellers();
  return providers.filter((provider) => providerMatchesCategory(provider, categorySlug)).map(mapSellerToCard);
}

export async function getMarketplaceProviders() {
  const providers = await getApprovedSellers();
  const providerIds = providers.map((provider) => provider.id);
  const [mediaMap, ratingMap, badgeMap] = await Promise.all([
    getProviderMediaMap(providerIds),
    getProviderRatingMap(providerIds),
    getProviderBadgeMap(providerIds),
  ]);

  return providers.map((provider) => mapSellerToMarketplace(
    provider,
    mediaMap.get(provider.id),
    ratingMap.get(provider.id),
    badgeMap.get(provider.id) || [],
  ));
}

function emptyRatingStats(): RatingStats {
  return { rating: 0, reviewCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
}

function calculateRatingStats(rows: Array<{ rating: number | null }>): RatingStats {
  const ratings = rows.map((row) => Number(row.rating || 0)).filter((rating) => rating > 0);
  if (!ratings.length) return emptyRatingStats();

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
  for (const rating of ratings) {
    const star = Math.max(1, Math.min(5, Math.round(rating)));
    distribution[star] += 1;
  }

  return {
    rating: Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10,
    reviewCount: ratings.length,
    distribution,
  };
}

function mediaFromRows(rows: UserImageRow[], profileImageUrl?: string | null): ProviderMedia {
  const portfolioPhotos = rows
    .filter((row) => row.image_type === "portfolio")
    .map((row) => row.image_url)
    .filter((url): url is string => Boolean(url));
  const profileVideoRow = rows.find((row) => row.image_type === "portfolio_video" && row.image_url);
  const profileVideoThumbnail = videoThumbnailFor(profileVideoRow);
  const profileVideo = profileVideoRow?.image_url
    ? {
      url: profileVideoRow.image_url,
      thumbnailUrl: profileVideoThumbnail || profileVideoRow.image_url,
    }
    : null;

  return {
    heroImage: profileVideo?.thumbnailUrl || portfolioPhotos[0] || profileImageUrl || null,
    portfolioPhotos,
    profileVideo,
  };
}

async function getProviderMediaMap(providerIds: string[]) {
  const media = new Map<string, ProviderMedia>();
  if (!providerIds.length) return media;

  const supabase = createAdminSupabaseClient() as unknown as UserImagesSupabaseClient;
  const { data, error } = await supabase
    .from("user_images")
    .select("user_id,image_url,image_type,description,created_at")
    .in("user_id", providerIds)
    .in("image_type", ["portfolio", "portfolio_video"])
    .order("created_at", { ascending: false }) as { data: UserImageRow[] | null; error: { message: string } | null };

  if (error) {
    console.error("Failed to load provider media:", error.message);
    return media;
  }

  const rowsByProvider = new Map<string, UserImageRow[]>();
  for (const row of data || []) {
    if (!row.user_id) continue;
    rowsByProvider.set(row.user_id, [...(rowsByProvider.get(row.user_id) || []), row]);
  }

  for (const [providerId, rows] of rowsByProvider.entries()) {
    media.set(providerId, mediaFromRows(rows));
  }

  return media;
}

async function getProviderRatingMap(providerIds: string[]) {
  const ratings = new Map<string, RatingStats>();
  if (!providerIds.length) return ratings;

  const supabase = createAdminSupabaseClient() as never as { from(table: string): any };
  const { data, error } = await supabase
    .from("eloo_reviews")
    .select("reviewee_id,rating,is_public")
    .in("reviewee_id", providerIds)
    .eq("is_public", true) as { data: Array<{ reviewee_id: string | null; rating: number | null }> | null; error: { message: string } | null };

  if (error) {
    console.error("Failed to load provider ratings:", error.message);
    return ratings;
  }

  const rowsByProvider = new Map<string, Array<{ rating: number | null }>>();
  for (const row of data || []) {
    if (!row.reviewee_id) continue;
    rowsByProvider.set(row.reviewee_id, [...(rowsByProvider.get(row.reviewee_id) || []), { rating: row.rating }]);
  }

  for (const [providerId, rows] of rowsByProvider.entries()) {
    ratings.set(providerId, calculateRatingStats(rows));
  }

  return ratings;
}

async function getProviderBadgeMap(providerIds: string[]) {
  const badges = new Map<string, string[]>();
  if (!providerIds.length) return badges;

  const supabase = createAdminSupabaseClient() as never as { from(table: string): any };
  const { data: awards, error: awardError } = await supabase
    .from("provider_badges")
    .select("provider_id,badge_id")
    .in("provider_id", providerIds) as { data: BadgeAwardRow[] | null; error: { message: string } | null };

  if (awardError) {
    console.error("Failed to load provider badge awards:", awardError.message);
    return badges;
  }

  const badgeIds = Array.from(new Set((awards || []).map((award) => award.badge_id).filter((id): id is string => Boolean(id))));
  if (!badgeIds.length) return badges;

  const { data: definitions, error: definitionError } = await supabase
    .from("badge_definitions")
    .select("id,name,is_active")
    .in("id", badgeIds)
    .eq("is_active", true) as { data: BadgeDefinitionRow[] | null; error: { message: string } | null };

  if (definitionError) {
    console.error("Failed to load badge definitions:", definitionError.message);
    return badges;
  }

  const definitionMap = new Map((definitions || []).map((definition) => [definition.id, definition.name || ""]));
  for (const award of awards || []) {
    if (!award.provider_id || !award.badge_id) continue;
    const name = definitionMap.get(award.badge_id);
    if (!name) continue;
    badges.set(award.provider_id, [...(badges.get(award.provider_id) || []), name]);
  }

  return badges;
}

export async function getProviderProfileById(id: string) {
  const supabase = createAdminSupabaseClient() as unknown as SellersSupabaseClient & UserImagesSupabaseClient & ReviewsSupabaseClient;
  const { data, error } = await supabase
    .from("sellers")
    .select("id,email,first_name,last_name,phone,profile_image_url,city,country,service_category,experience_level,description,hourly_rate,status,rating,total_jobs,availability,created_at")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (error) {
    console.error("Failed to load provider profile:", error.message);
    notFound();
  }

  if (!data) notFound();

  const [portfolioResult, reviewResult, approvedProviders, badgeMap] = await Promise.all([
    supabase
      .from("user_images")
      .select("image_url,image_type,description")
      .eq("user_id", id)
      .in("image_type", ["portfolio", "portfolio_video"])
      .order("created_at", { ascending: false }),
    supabase
      .from("eloo_reviews")
      .select("id,rating,comment,created_at,reviewer_id,reviewer:eloo_profiles!eloo_reviews_reviewer_id_fkey(first_name,last_name)")
      .eq("reviewee_id", id)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(8),
    getApprovedSellers(),
    getProviderBadgeMap([id]),
  ]);

  if (portfolioResult.error) {
    console.error("Failed to load provider portfolio images:", portfolioResult.error.message);
  }

  if (reviewResult.error) {
    console.error("Failed to load provider written reviews:", reviewResult.error.message);
  }

  const providerRow = data as SellerRow;
  const media = mediaFromRows((portfolioResult.data || []) as UserImageRow[], providerRow.profile_image_url);
  const ratings = calculateRatingStats(reviewResult.data || []);
  const badges = badgeMap.get(id) || [];
  const possibleRelatedProviders = approvedProviders.filter((seller) => seller.id !== id);
  const sameCategoryProviders = possibleRelatedProviders.filter((seller) => providerMatchesCategory(seller, categorySlugFor(providerRow.service_category)));
  const relatedSellerRows = (sameCategoryProviders.length ? sameCategoryProviders : possibleRelatedProviders).slice(0, 4);
  const relatedIds = relatedSellerRows.map((seller) => seller.id);
  const [relatedMediaMap, relatedRatingMap, relatedBadgeMap] = await Promise.all([
    getProviderMediaMap(relatedIds),
    getProviderRatingMap(relatedIds),
    getProviderBadgeMap(relatedIds),
  ]);
  const relatedProviders = relatedSellerRows
    .map((seller) => mapSellerToMarketplace(
      seller,
      relatedMediaMap.get(seller.id),
      relatedRatingMap.get(seller.id),
      relatedBadgeMap.get(seller.id) || [],
    ))
    .slice(0, 4);
  const writtenReviews = mapReviewRows(reviewResult.data || [], providerRow);

  return mapSellerToProfile(providerRow, media, ratings, writtenReviews, relatedProviders, badges);
}
