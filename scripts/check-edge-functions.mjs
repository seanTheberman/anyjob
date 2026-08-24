import fs from "node:fs";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are required");
}

const parsedUrl = new URL(supabaseUrl);
if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname.endsWith(".supabase.co")) {
  throw new Error(`Unexpected Supabase URL: ${parsedUrl.origin}`);
}

const anonPayload = JSON.parse(Buffer.from(anonKey.split(".")[1] || "", "base64url").toString("utf8"));
if (anonPayload.role !== "anon" || parsedUrl.hostname !== `${anonPayload.ref}.supabase.co`) {
  throw new Error("The Supabase URL and public anon key belong to different projects");
}

const notificationFunctions = [
  "billing-notifications",
  "job-expiry-notifications",
  "job-live-notifications",
  "job-notifications",
  "job-payment-notifications",
  "job-reminder-notifications",
  "kyc-notifications",
  "legal-notifications",
  "promo-notifications",
  "quote-notifications",
  "review-notifications",
  "select-quote-notifications",
  "shift-notifications",
  "support-notifications",
  "unread-alert-notifications",
  "welcome-notifications",
];

const testEmail = `edge-healthcheck-${Date.now()}@example.invalid`;
const tests = [
  {
    name: "forgot-password",
    body: { tenantSlug: "default", email: testEmail },
    expected: [200],
    key: anonKey,
  },
  {
    name: "email-verification",
    body: { tenantSlug: "default", email: testEmail },
    expected: [200],
    key: anonKey,
  },
  {
    name: "reset-password",
    body: { tenantSlug: "default", email: testEmail, token: "invalid-healthcheck-token", password: "HealthcheckPassword1!" },
    expected: [400],
    key: anonKey,
  },
  ...notificationFunctions.map((name) => ({
    name,
    body: { tenantSlug: "default", action: "__healthcheck__" },
    expected: [400],
    key: serviceRoleKey,
  })),
];

async function runTest(test) {
  const response = await fetch(`${supabaseUrl}/functions/v1/${test.name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: test.key,
      Authorization: `Bearer ${test.key}`,
    },
    body: JSON.stringify(test.body),
    signal: AbortSignal.timeout(15_000),
  });

  if (!test.expected.includes(response.status)) {
    const body = await response.text();
    throw new Error(`${test.name} returned ${response.status}: ${body.slice(0, 240)}`);
  }
  return `${test.name}: ${response.status}`;
}

const results = await Promise.all(tests.map(runTest));

const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-review-ratings`, {
  method: "GET",
  headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  signal: AbortSignal.timeout(15_000),
});
if (syncResponse.status !== 405) {
  throw new Error(`sync-review-ratings returned ${syncResponse.status}; expected 405`);
}
results.push(`sync-review-ratings: ${syncResponse.status}`);

for (const result of results.sort()) console.log(result);
console.log(`Verified ${results.length} deployed Edge Functions at ${parsedUrl.hostname}`);
