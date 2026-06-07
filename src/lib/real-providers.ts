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
    .select("id,email,first_name,last_name,phone,profile_image_url,city,country,service_category,experience_level,description,hourly_rate,status,rating,total_jobs,created_at")
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

export async function getProviderProfileById(id: string) {
  const supabase = createAdminSupabaseClient() as unknown as SellersSupabaseClient;
  const { data, error } = await supabase
    .from("sellers")
    .select("id,email,first_name,last_name,phone,profile_image_url,city,country,service_category,experience_level,description,hourly_rate,status,rating,total_jobs,created_at")
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
