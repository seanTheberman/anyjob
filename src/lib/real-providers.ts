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
  level: "New" | "Level 1" | "Level 2" | "Top Pro";
  badges: string[];
  availability: "Today" | "This week" | "Weekends" | "Evenings" | "Remote";
  responseTime: string;
  description: string;
  services: string[];
  searchText: string;
  categorySlug: string;
  heroImage: string;
};

export type ProviderProfileData = {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  avatar: string | null;
  rating: number;
  reviewCount: number;
  email: string;
  phone: string;
  location: string;
  experience: string;
  biography: string;
  services: string[];
  hourlyRate: string;
  availability: string;
  photos: string[];
  highlights: string[];
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

type SellersSupabaseClient = {
  from(table: "sellers"): {
    select(columns: string): {
      eq(column: string, value: string): SellersQuery;
    };
  };
};

type SellersQuery = {
  eq(column: string, value: string): SellersQuery;
  order(column: string, options: { ascending: boolean }): Promise<{ data: SellerRow[] | null; error: { message: string } | null }>;
  maybeSingle(): Promise<{ data: SellerRow | null; error: { message: string } | null }>;
};

const DEFAULT_RATE = 25;

const FALLBACK_IMAGES: Record<string, string> = {
  "aide-domicile": "https://images.unsplash.com/photo-1576765608622-067973a79f53?q=80&w=900&auto=format&fit=crop",
  animaux: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=900&auto=format&fit=crop",
  bricolage: "https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=900&auto=format&fit=crop",
  "cours-particuliers": "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=900&auto=format&fit=crop",
  demenagement: "https://images.unsplash.com/photo-1600518464441-9306b00c4a83?q=80&w=900&auto=format&fit=crop",
  enfants: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?q=80&w=900&auto=format&fit=crop",
  hiver: "https://images.unsplash.com/photo-1517299321609-52687d1bc55a?q=80&w=900&auto=format&fit=crop",
  informatique: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=900&auto=format&fit=crop",
  jardinage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=900&auto=format&fit=crop",
  menage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=900&auto=format&fit=crop",
  search: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=900&auto=format&fit=crop",
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
  const tags = [
    provider.service_category,
    provider.experience_level ? `${provider.experience_level} experience` : null,
    provider.city,
  ].filter((tag): tag is string => Boolean(tag && tag.trim()));

  return tags.length ? tags : ["Verified provider"];
}

function deterministicIndex(value: string, size: number) {
  const sum = value.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return size ? sum % size : 0;
}

function providerLevel(provider: SellerRow): ProviderMarketplaceData["level"] {
  const rating = Number(provider.rating || 0);
  const jobs = Number(provider.total_jobs || 0);
  if (rating >= 4.8 && jobs >= 25) return "Top Pro";
  if (rating >= 4.5 && jobs >= 10) return "Level 2";
  if (jobs > 0) return "Level 1";
  return "New";
}

function providerAvailability(provider: SellerRow): ProviderMarketplaceData["availability"] {
  const availabilityOptions: ProviderMarketplaceData["availability"][] = ["Today", "This week", "Weekends", "Evenings", "Remote"];
  const raw = JSON.stringify(provider.availability || {}).toLowerCase();
  if (raw.includes("remote")) return "Remote";
  if (raw.includes("weekend")) return "Weekends";
  if (raw.includes("evening")) return "Evenings";
  return availabilityOptions[deterministicIndex(provider.id, availabilityOptions.length)];
}

function providerBadges(provider: SellerRow) {
  const rating = Number(provider.rating || 0);
  const jobs = Number(provider.total_jobs || 0);
  const badges = ["Verified ID"];

  if (rating >= 4.8) badges.push("Top Rated");
  if (jobs >= 15) badges.push("Proven Expert");
  if (provider.hourly_rate && provider.hourly_rate <= 30) badges.push("Value Choice");
  if (provider.experience_level) badges.push("Skilled");
  if (!jobs) badges.push("Rising Talent");

  return badges.slice(0, 4);
}

function serviceList(provider: SellerRow) {
  const category = provider.service_category || "Service provider";
  const tags = serviceTags(provider);
  return [
    category,
    ...tags,
    `${category} booking`,
    `${category} specialist`,
  ].filter((value, index, array) => value && array.indexOf(value) === index);
}

function mapSellerToCard(provider: SellerRow): ProviderCardData {
  return {
    id: provider.id,
    slug: provider.id,
    name: providerName(provider),
    category: provider.service_category || "Service provider",
    rate: provider.hourly_rate && provider.hourly_rate > 0 ? provider.hourly_rate : DEFAULT_RATE,
    image: provider.profile_image_url || null,
    isNew: Number(provider.total_jobs || 0) === 0,
    tags: serviceTags(provider),
  };
}

function mapSellerToMarketplace(provider: SellerRow): ProviderMarketplaceData {
  const category = provider.service_category || "Service provider";
  const categorySlug = categorySlugFor(category);
  const services = serviceList(provider);
  const rate = provider.hourly_rate && provider.hourly_rate > 0 ? provider.hourly_rate : DEFAULT_RATE;
  const city = provider.city || "Nearby";
  const country = provider.country || "";
  const rating = Number(provider.rating || 0);
  const reviewCount = Number(provider.total_jobs || 0);
  const badges = providerBadges(provider);
  const level = providerLevel(provider);
  const availability = providerAvailability(provider);
  const tags = [
    level,
    availability,
    ...badges,
    ...serviceTags(provider),
  ].filter((value, index, array) => value && array.indexOf(value) === index);
  const description = provider.description || `I will provide reliable ${category.toLowerCase()} services with clear communication and local experience.`;
  const heroImage = provider.profile_image_url || FALLBACK_IMAGES[categorySlug] || FALLBACK_IMAGES.search;
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
    completedJobs: reviewCount,
    level,
    badges,
    availability,
    responseTime: `${deterministicIndex(provider.id, 5) + 1}h avg response`,
    description,
    services,
    searchText,
    heroImage,
    tags,
  };
}

function mapSellerToProfile(provider: SellerRow): ProviderProfileData {
  const category = provider.service_category || "Service provider";
  const rate = provider.hourly_rate && provider.hourly_rate > 0 ? provider.hourly_rate : DEFAULT_RATE;
  const location = [provider.city, provider.country].filter(Boolean).join(", ") || "Location not provided";
  const serviceList = serviceTags(provider);

  return {
    id: provider.id,
    name: providerName(provider),
    category,
    categorySlug: categorySlugFor(category),
    avatar: provider.profile_image_url || null,
    rating: Number(provider.rating || 0),
    reviewCount: Number(provider.total_jobs || 0),
    email: provider.email || "",
    phone: provider.phone || "",
    location,
    experience: provider.experience_level ? `${provider.experience_level} experience` : "Verified professional",
    biography: provider.description || "This provider has not added a biography yet.",
    services: serviceList,
    hourlyRate: `From $${rate} / hour`,
    availability: "Contact provider for availability",
    photos: provider.profile_image_url ? [provider.profile_image_url] : [],
    highlights: ["Approved provider", "Real AnyJob profile", "Verified account data"],
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
  return providers.map(mapSellerToMarketplace);
}

export async function getProviderProfileById(id: string) {
  const supabase = createAdminSupabaseClient() as unknown as SellersSupabaseClient;
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

  return mapSellerToProfile(data as SellerRow);
}
