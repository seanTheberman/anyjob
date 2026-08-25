import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...parts] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = parts.join("=").replace(/^["']|["']$/g, "");
  }
}

loadEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.ANYJOB_INDIA_TEST_PASSWORD;
if (!url || !serviceRole || !password) {
  throw new Error("Missing Supabase credentials or ANYJOB_INDIA_TEST_PASSWORD.");
}

const db = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const buyers = [
  {
    email: "india.buyer.bengaluru@anyjob.test",
    firstName: "Bengaluru",
    lastName: "Test Buyer",
    city: "Bengaluru",
    region: "Karnataka",
    postalCode: "560001",
    latitude: 12.9716,
    longitude: 77.5946,
    phone: "+919000000001",
  },
  {
    email: "india.buyer.mumbai@anyjob.test",
    firstName: "Mumbai",
    lastName: "Test Buyer",
    city: "Mumbai",
    region: "Maharashtra",
    postalCode: "400001",
    latitude: 19.076,
    longitude: 72.8777,
    phone: "+919000000002",
  },
];

const sellers = [
  {
    email: "india.seller.cleaning@anyjob.test",
    firstName: "Ananya",
    lastName: "Test Cleaner",
    city: "Bengaluru",
    region: "Karnataka",
    postalCode: "560001",
    latitude: 12.9716,
    longitude: 77.5946,
    phone: "+919000000011",
    category: "Cleaning",
    rate: 650,
    radius: 25,
    shift: true,
    serviceTitle: "Home and apartment cleaning",
    serviceDescription: "Dummy cleaning service for India marketplace testing.",
    tags: ["deep cleaning", "regular cleaning", "kitchen", "bathroom"],
  },
  {
    email: "india.seller.handyman@anyjob.test",
    firstName: "Rohan",
    lastName: "Test Handyman",
    city: "Mumbai",
    region: "Maharashtra",
    postalCode: "400001",
    latitude: 19.076,
    longitude: 72.8777,
    phone: "+919000000012",
    category: "Handyman",
    rate: 800,
    radius: 30,
    shift: false,
    serviceTitle: "Home repairs and furniture assembly",
    serviceDescription: "Dummy handyman service for India marketplace testing.",
    tags: ["repairs", "furniture assembly", "painting", "plumbing"],
  },
  {
    email: "india.seller.it@anyjob.test",
    firstName: "Priya",
    lastName: "Test Technician",
    city: "Bengaluru",
    region: "Karnataka",
    postalCode: "560102",
    latitude: 12.9121,
    longitude: 77.6446,
    phone: "+919000000013",
    category: "IT Support",
    rate: 950,
    radius: 35,
    shift: true,
    serviceTitle: "Computer and WiFi support",
    serviceDescription: "Dummy technology support service for India marketplace testing.",
    tags: ["computer repair", "wifi", "software", "device setup"],
  },
  {
    email: "india.seller.moving@anyjob.test",
    firstName: "Arjun",
    lastName: "Test Mover",
    city: "New Delhi",
    region: "Delhi",
    postalCode: "110001",
    latitude: 28.6139,
    longitude: 77.209,
    phone: "+919000000014",
    category: "Moving",
    rate: 900,
    radius: 40,
    shift: false,
    serviceTitle: "Local moving assistance",
    serviceDescription: "Dummy moving service for India marketplace testing.",
    tags: ["moving", "packing", "heavy lifting", "transport"],
  },
];

const allAccounts = [
  ...buyers.map((account) => ({ ...account, authRole: "buyer", profileRole: "client" })),
  ...sellers.map((account) => ({ ...account, authRole: "seller", profileRole: "provider" })),
];

async function requireSuccess(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

const { data: listed, error: listError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) throw listError;
const targetEmails = new Set(allAccounts.map((account) => account.email));
const oldUsers = listed.users.filter((user) => targetEmails.has(user.email || ""));
const oldIds = oldUsers.map((user) => user.id);

if (oldIds.length) {
  await requireSuccess(await db.from("service_inquiries").delete().in("user_id", oldIds), "delete old jobs");
  await requireSuccess(await db.from("service_inquiries").delete().in("target_provider_id", oldIds), "delete old private jobs");
  await requireSuccess(await db.from("seller_service_areas").delete().in("seller_id", oldIds), "delete old service areas");
  await requireSuccess(await db.from("eloo_provider_services").delete().in("provider_id", oldIds), "delete old services");
  await requireSuccess(await db.from("shift_worker_profiles").delete().in("user_id", oldIds), "delete old shift profiles");
  await requireSuccess(await db.from("provider_plan_subscriptions").delete().in("user_id", oldIds), "delete old plans");
  await requireSuccess(await db.from("user_market_locations").delete().in("user_id", oldIds), "delete old locations");
  await requireSuccess(await db.from("buyers").delete().in("id", oldIds), "delete old buyers");
  await requireSuccess(await db.from("sellers").delete().in("id", oldIds), "delete old sellers");
  await requireSuccess(await db.from("eloo_profiles").delete().in("id", oldIds), "delete old profiles");
  for (const user of oldUsers) await db.auth.admin.deleteUser(user.id);
}

const ids = new Map();
for (const account of allAccounts) {
  const { data, error } = await db.auth.admin.createUser({
    email: account.email,
    password,
    email_confirm: true,
    user_metadata: {
      role: account.authRole,
      first_name: account.firstName,
      last_name: account.lastName,
    },
  });
  if (error || !data.user) throw new Error(`create ${account.email}: ${error?.message || "missing user"}`);
  ids.set(account.email, data.user.id);
}

const now = new Date().toISOString();
for (const account of allAccounts) {
  const id = ids.get(account.email);
  await requireSuccess(await db.from("eloo_profiles").upsert({
    id,
    email: account.email,
    first_name: account.firstName,
    last_name: account.lastName,
    role: account.profileRole,
    phone: account.phone,
    bio: `Dummy ${account.authRole} account for India marketplace testing.`,
    city: account.city,
    postal_code: account.postalCode,
    latitude: account.latitude,
    longitude: account.longitude,
    is_verified: true,
    kyc_status: "approved",
    provider_work_mode: account.authRole === "seller" ? (account.shift ? "both" : "freelance") : null,
    can_work_freelance: account.authRole === "seller",
    can_work_shifts: Boolean(account.shift),
    country: "India",
    country_code: "IN",
    region: account.region,
    location_verified_at: now,
    updated_at: now,
  }), `profile ${account.email}`);

  await requireSuccess(await db.from("user_market_locations").upsert({
    user_id: id,
    country_code: "IN",
    country_name: "India",
    region: account.region,
    city: account.city,
    postal_code: account.postalCode,
    coarse_latitude: account.latitude,
    coarse_longitude: account.longitude,
    accuracy_meters: 1000,
    ip_country_code: "IN",
    gps_country_code: "IN",
    verification_source: "gps_ip",
    verified_at: now,
    updated_at: now,
  }), `location ${account.email}`);
}

for (const buyer of buyers) {
  await requireSuccess(await db.from("buyers").insert({
    id: ids.get(buyer.email),
    email: buyer.email,
    first_name: buyer.firstName,
    last_name: buyer.lastName,
    phone: buyer.phone,
    address: `Dummy address, ${buyer.city}`,
    city: buyer.city,
    postal_code: buyer.postalCode,
    country: "India",
    country_code: "IN",
    region: buyer.region,
    preferred_language: "en",
    email_verified: true,
    phone_verified: true,
    kyc_status: "approved",
    location_verified_at: now,
  }), `buyer ${buyer.email}`);
}

for (const seller of sellers) {
  const sellerId = ids.get(seller.email);
  await requireSuccess(await db.from("sellers").insert({
    id: sellerId,
    email: seller.email,
    first_name: seller.firstName,
    last_name: seller.lastName,
    phone: seller.phone,
    address: `Dummy service address, ${seller.city}`,
    city: seller.city,
    postal_code: seller.postalCode,
    country: "India",
    country_code: "IN",
    region: seller.region,
    birth_date: "1992-01-01",
    service_category: seller.category,
    experience_level: "Experienced",
    description: `${seller.serviceDescription} This is clearly marked dummy test data.`,
    hourly_rate: seller.rate,
    availability: {
      marketplaceAvailability: "Available this week",
      responseTime: "Usually responds within 1 hour",
      contactWindows: ["Weekdays 09:00-18:00", "Saturday 10:00-16:00"],
    },
    status: "approved",
    approved_at: now,
    terms_accepted: true,
    email_verified: true,
    phone_verified: true,
    background_check_status: "approved",
    insurance_status: "approved",
    provider_work_mode: seller.shift ? "both" : "freelance",
    can_work_freelance: true,
    can_work_shifts: seller.shift,
    service_area_radius_km: seller.radius,
    location_verified_at: now,
  }), `seller ${seller.email}`);

  await requireSuccess(await db.from("seller_service_areas").insert({
    seller_id: sellerId,
    provider: "profile",
    provider_place_id: `india-demo-${seller.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    label: `${seller.city}, ${seller.region}, India`,
    locality: seller.city,
    region: seller.region,
    country_name: "India",
    country_code: "IN",
    postal_code: seller.postalCode,
    latitude: seller.latitude,
    longitude: seller.longitude,
    radius_km: seller.radius,
    is_primary: true,
  }), `service area ${seller.email}`);

  await requireSuccess(await db.from("eloo_provider_services").insert({
    provider_id: sellerId,
    title: seller.serviceTitle,
    description: seller.serviceDescription,
    hourly_rate: seller.rate,
    min_hours: 2,
    max_radius_km: seller.radius,
    is_active: true,
    tags: seller.tags,
    gig_details: {
      category: seller.category,
      packages: [
        { tier: "starter", title: "Starter", description: "Two-hour test package", price: seller.rate * 2, deliveryDays: 1, revisions: 0, features: seller.tags.slice(0, 2) },
        { tier: "standard", title: "Standard", description: "Half-day test package", price: seller.rate * 4, deliveryDays: 2, revisions: 1, features: seller.tags.slice(0, 3) },
        { tier: "premium", title: "Premium", description: "Full-day test package", price: seller.rate * 8, deliveryDays: 3, revisions: 2, features: seller.tags },
      ],
    },
  }), `provider service ${seller.email}`);

  if (seller.shift) {
    await requireSuccess(await db.from("shift_worker_profiles").insert({
      user_id: sellerId,
      provider_profile_id: sellerId,
      work_mode: "both",
      niches: [seller.category.toLowerCase().replaceAll(" ", "-")],
      preferred_roles: [seller.serviceTitle],
      skills: seller.tags,
      certifications: [],
      availability: { weekdays: true, weekends: true },
      travel_radius_km: seller.radius,
      preferred_hourly_rate: seller.rate,
      preferred_day_rate: seller.rate * 8,
      market_rate_acknowledged_at: now,
      open_to_freelance_jobs: true,
      open_to_urgent_shifts: true,
      open_to_recurring_shifts: true,
      reliability_score: 100,
      status: "available",
      country_code: "IN",
    }), `shift profile ${seller.email}`);
  }
}

const bengaluruBuyerId = ids.get(buyers[0].email);
const mumbaiBuyerId = ids.get(buyers[1].email);
const publicJobs = [
  [bengaluruBuyerId, buyers[0], "menage", "grand-menage", "Deep clean a two-bedroom apartment", "Need kitchen, bathrooms, floors, and balcony cleaned before the weekend.", 2000, 3500, "2026-08-29"],
  [bengaluruBuyerId, buyers[0], "bricolage", "montage-meubles", "Assemble wardrobe and study desk", "Flat-pack wardrobe and desk need assembly. Tools should be brought by the provider.", 1800, 3000, "2026-08-30"],
  [bengaluruBuyerId, buyers[0], "informatique", "installation-wifi", "Improve WiFi coverage in home", "Configure the router and add a mesh access point for two floors.", 1500, 2800, "2026-09-01"],
  [mumbaiBuyerId, buyers[1], "demenagement", "aide-demenagement", "Help move boxes within Mumbai", "Need two people to load and unload household boxes and small furniture.", 3500, 6000, "2026-08-31"],
  [mumbaiBuyerId, buyers[1], "bricolage", "plomberie", "Repair leaking kitchen tap", "Kitchen mixer tap is leaking and may need a washer or cartridge replacement.", 800, 1800, "2026-08-28"],
  [mumbaiBuyerId, buyers[1], "menage", "nettoyage-vitres", "Window cleaning for office", "Clean interior glass and accessible exterior windows in a small office.", 2500, 4500, "2026-09-02"],
];

for (const [userId, buyer, category, subcategory, title, description, min, max, date] of publicJobs) {
  await requireSuccess(await db.from("service_inquiries").insert({
    user_id: userId,
    email: buyer.email,
    phone: buyer.phone,
    first_name: buyer.firstName,
    last_name: buyer.lastName,
    category_slug: category,
    subcategory_slug: subcategory,
    service_type: "one_time",
    job_description: `${title}\n\n${description}\n\nDUMMY INDIA TEST JOB`,
    job_urgency: "this_week",
    preferred_date: date,
    preferred_time_start: "10:00",
    preferred_time_end: "16:00",
    flexible_timing: true,
    address: `Dummy service address, ${buyer.city}`,
    city: buyer.city,
    postal_code: buyer.postalCode,
    estimated_duration_hours: 3,
    number_of_people_needed: 1,
    budget_range_min: min,
    budget_range_max: max,
    materials_provided: false,
    status: "submitted",
    session_id: `india-demo-${randomUUID()}`,
    submitted_at: now,
    custom_tags: ["dummy", "india test"],
    coarse_latitude: buyer.latitude,
    coarse_longitude: buyer.longitude,
    location_accuracy_meters: 1000,
    coarse_location_label: `${buyer.city}, ${buyer.postalCode.slice(0, 3)} area`,
    country: "India",
    country_code: "IN",
    region: buyer.region,
    location_verified_at: now,
    request_visibility: "public",
    provider_decision_status: "not_required",
  }), `public job ${title}`);
}

const targetSeller = sellers[0];
const privateId = randomUUID();
await requireSuccess(await db.from("service_inquiries").insert({
  id: privateId,
  user_id: bengaluruBuyerId,
  email: buyers[0].email,
  phone: buyers[0].phone,
  first_name: buyers[0].firstName,
  last_name: buyers[0].lastName,
  category_slug: "menage",
  subcategory_slug: "menage-regulier",
  service_type: "one_time",
  job_description: "Private home cleaning request\n\nPlease clean a one-bedroom apartment on Saturday morning.\n\nDUMMY INDIA PRIVATE TEST JOB",
  job_urgency: "this_week",
  preferred_date: "2026-08-29",
  preferred_time_start: "09:00",
  address: "Dummy private address, Bengaluru",
  city: "Bengaluru",
  postal_code: "560001",
  estimated_duration_hours: 3,
  budget_range_min: 1800,
  budget_range_max: 2600,
  status: "pending",
  session_id: `india-private-${randomUUID()}`,
  submitted_at: now,
  custom_tags: ["dummy", "private request"],
  coarse_latitude: buyers[0].latitude,
  coarse_longitude: buyers[0].longitude,
  location_accuracy_meters: 1000,
  coarse_location_label: "Bengaluru, 560 area",
  country: "India",
  country_code: "IN",
  region: "Karnataka",
  location_verified_at: now,
  request_visibility: "private",
  target_provider_id: ids.get(targetSeller.email),
  provider_decision_status: "pending",
}), "private request");

const conversation = await requireSuccess(await db.from("eloo_conversations").insert({
  client_id: bengaluruBuyerId,
  provider_id: ids.get(targetSeller.email),
  inquiry_id: privateId,
  bid_id: null,
  is_active: true,
  last_message_at: now,
}).select("id").single(), "private conversation");

await requireSuccess(await db.from("eloo_messages").insert({
  conversation_id: conversation.id,
  sender_id: bengaluruBuyerId,
  content: "PRIVATE JOB REQUIREMENTS\n\nPrivate home cleaning request\n\nPlease clean a one-bedroom apartment on Saturday morning.\n\nPlease accept with a quote or reject this dummy test request.",
  attachments: [],
}), "private requirements message");

console.log(JSON.stringify({
  buyers: buyers.map((buyer) => ({ email: buyer.email, id: ids.get(buyer.email), city: buyer.city })),
  sellers: sellers.map((seller) => ({ email: seller.email, id: ids.get(seller.email), city: seller.city, shift: seller.shift })),
  publicJobs: publicJobs.length,
  privateRequestId: privateId,
}, null, 2));
