import { expect, test, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

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

function adminDb(): SupabaseClient {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase URL or service role key for admin e2e tests.");
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function loginAsAdmin(page: Page) {
  await page.goto("/admin-login");
  await expect(page.getByRole("heading", { name: "Admin login" })).toBeVisible();
  await page.getByLabel("Admin email").fill("admin@anyjob.eu");
  await page.getByLabel("Password", { exact: true }).fill("Admin123!");
  await page.getByRole("button", { name: "Enter admin console" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Marketplace overview" })).toBeVisible();
}

async function gotoAdminRoute(page: Page, route: string) {
  const routePattern = new RegExp(`${route.replaceAll("/", "\\/")}$`);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(route, { waitUntil: "commit" });
      await expect(page).toHaveURL(routePattern, { timeout: 5000 });
      return;
    } catch (error) {
      if (!String(error).includes("ERR_ABORTED") && attempt === 2) {
        throw error;
      }
      if (String(error).includes("ERR_ABORTED") && attempt === 2) {
        throw error;
      }
      await page.waitForTimeout(300);
    }
  }
}

test.describe.configure({ mode: "serial" });

test.describe("admin console", () => {
  let db: SupabaseClient;
  let providerId: string;
  let businessId: string;
  let providerEmail: string;
  let businessOwnerId: string;
  let businessOwnerEmail: string;

  test.beforeAll(async () => {
    db = adminDb();

    const { data: adminUser, error: adminLookupError } = await db
      .from("eloo_profiles")
      .select("id")
      .eq("email", "admin@anyjob.eu")
      .single();

    if (adminLookupError || !adminUser?.id) {
      throw new Error(`Admin profile lookup failed: ${adminLookupError?.message || "missing admin profile"}`);
    }

    providerEmail = `admin-e2e-provider-${randomUUID()}@anyjob.test`;
    businessOwnerEmail = `admin-e2e-business-owner-${randomUUID()}@anyjob.test`;
    businessId = randomUUID();

    await db.from("sellers").delete().eq("email", "admin-e2e-provider@anyjob.test");
    await db.from("business_profiles").delete().eq("contact_email", "admin-e2e-business@anyjob.test");

    const { data: createdUser, error: createUserError } = await db.auth.admin.createUser({
      email: providerEmail,
      password: `Provider-${randomUUID()}!`,
      email_confirm: true,
      user_metadata: {
        role: "seller",
        first_name: "AdminE2E",
        last_name: "Provider",
      },
    });

    if (createUserError || !createdUser.user?.id) {
      throw new Error(`Provider auth user seed failed: ${createUserError?.message || "missing user id"}`);
    }

    providerId = createdUser.user.id;

    const { data: createdBusinessOwner, error: createBusinessOwnerError } = await db.auth.admin.createUser({
      email: businessOwnerEmail,
      password: `Business-${randomUUID()}!`,
      email_confirm: true,
      user_metadata: {
        role: "business",
        first_name: "AdminE2E",
        last_name: "BusinessOwner",
      },
    });

    if (createBusinessOwnerError || !createdBusinessOwner.user?.id) {
      throw new Error(`Business owner auth user seed failed: ${createBusinessOwnerError?.message || "missing user id"}`);
    }

    businessOwnerId = createdBusinessOwner.user.id;

    await db.from("eloo_profiles").upsert({
      id: businessOwnerId,
      email: businessOwnerEmail,
      first_name: "AdminE2E",
      last_name: "BusinessOwner",
      role: "business",
      has_business_profile: true,
      business_registration_status: "pending",
    });

    const now = new Date().toISOString();
    const { error: sellerError } = await db.from("sellers").insert({
      id: providerId,
      email: providerEmail,
      first_name: "AdminE2E",
      last_name: "Provider",
      phone: "0600000000",
      address: "1 Provider Test Street",
      city: "Paris",
      postal_code: "75001",
      country: "France",
      birth_date: "1990-01-01",
      service_category: "Cleaning",
      experience_level: "expert",
      description: "Temporary provider created by admin e2e tests.",
      siret: "99999999999991",
      hourly_rate: 25,
      availability: {},
      status: "pending",
      id_document_url: "https://example.com/id.pdf",
      selfie_video_url: "https://example.com/selfie.mp4",
      insurance_document_url: "https://example.com/insurance.pdf",
      insurance_status: "submitted",
      background_check_status: "pending",
      terms_accepted: true,
      newsletter_subscribed: false,
      email_verified: true,
      phone_verified: true,
      rating: 0,
      total_jobs: 0,
      created_at: now,
      updated_at: now,
    });

    if (sellerError) throw new Error(`Provider seed failed: ${sellerError.message}`);

    const { error: businessError } = await db.from("business_profiles").insert({
      id: businessId,
      owner_user_id: businessOwnerId,
      business_name: "Admin E2E Business",
      legal_name: "Admin E2E Business Ltd",
      registration_number: "E2E-REG-001",
      business_type: "company",
      industry: "Healthcare",
      contact_name: "Admin E2E",
      contact_email: "admin-e2e-business@anyjob.test",
      contact_phone: "0600000001",
      address: "1 Test Street",
      city: "Paris",
      postal_code: "75001",
      country: "France",
      document_url: "https://example.com/business.pdf",
      document_source: "url",
      typical_work_types: ["day_wage"],
      typical_roles_needed: ["Healthcare assistant"],
      status: "pending",
      created_at: now,
      updated_at: now,
    });

    if (businessError) throw new Error(`Business seed failed: ${businessError.message}`);
  });

  test.afterAll(async () => {
    if (!db) return;
    await db.from("business_profiles").delete().eq("id", businessId);
    await db.from("sellers").delete().eq("id", providerId);
    await db.from("eloo_profiles").delete().eq("id", businessOwnerId);
    if (providerId) await db.auth.admin.deleteUser(providerId);
    if (businessOwnerId) await db.auth.admin.deleteUser(businessOwnerId);
  });

  test("protects admin pages and signs in through dedicated admin login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin-login$/);
    await expect(page.getByRole("heading", { name: "Admin login" })).toBeVisible();

    await loginAsAdmin(page);
  });

  test("loads every admin page", async ({ page }) => {
    test.setTimeout(90_000);

    await loginAsAdmin(page);

    const routes = [
      ["/admin", "Marketplace overview"],
      ["/admin/users", "Users"],
      ["/admin/providers", "Providers"],
      ["/admin/businesses", "Businesses"],
      ["/admin/kyc", "KYC verification"],
      ["/admin/jobs", "Jobs"],
      ["/admin/badges", "Badges"],
      ["/admin/reports", "Reports"],
      ["/admin/payments", "Payments"],
      ["/admin/support", "Support"],
      ["/admin/analytics", "Analytics"],
      ["/admin/history", "History"],
      ["/admin/notifications", "Notifications"],
      ["/admin/blog", "Blog"],
      ["/admin/settings", "Settings"],
    ] as const;

    for (const [route, heading] of routes) {
      await gotoAdminRoute(page, route);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      await expect(page.getByText("Operations console").first()).toBeVisible();
    }
  });

  test("runs provider approve and suspend actions against temporary provider", async ({ page }) => {
    await loginAsAdmin(page);

    const approve = await page.request.post("/api/admin/providers/kyc", {
      data: { action: "approve", providerIds: [providerId] },
    });
    expect(approve.ok()).toBeTruthy();

    let { data: provider } = await db.from("sellers").select("status").eq("id", providerId).single();
    expect(provider?.status).toBe("approved");

    const suspend = await page.request.post("/api/admin/providers/kyc", {
      data: { action: "suspend", providerIds: [providerId] },
    });
    expect(suspend.ok()).toBeTruthy();

    ({ data: provider } = await db.from("sellers").select("status").eq("id", providerId).single());
    expect(provider?.status).toBe("suspended");
  });

  test("runs business approve and suspend actions against temporary business", async ({ page }) => {
    await loginAsAdmin(page);

    const approve = await page.request.post("/api/admin/businesses/review", {
      data: { action: "approve", businessIds: [businessId] },
    });
    expect(approve.ok()).toBeTruthy();

    let { data: business } = await db.from("business_profiles").select("status").eq("id", businessId).single();
    expect(business?.status).toBe("approved");

    const suspend = await page.request.post("/api/admin/businesses/review", {
      data: { action: "suspend", businessIds: [businessId] },
    });
    expect(suspend.ok()).toBeTruthy();

    ({ data: business } = await db.from("business_profiles").select("status").eq("id", businessId).single());
    expect(business?.status).toBe("suspended");
  });
});
