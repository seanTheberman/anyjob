import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) => {
    if (["font", "image", "media"].includes(route.request().resourceType())) {
      return route.abort();
    }
    return route.continue();
  });
});

test("matched home search opens the selected service at step 2", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("textbox", { name: "Search services" });

  await search.fill("plumb");
  const suggestion = page.getByRole("button", { name: "Handyman", exact: true });
  await expect(suggestion).toBeVisible();
  await suggestion.click();

  await expect(page).toHaveURL(/\/questionnaire\?category=bricolage/);
  await expect(page.getByRole("heading", { name: "Specify your need" })).toBeVisible();
});

test("unmatched home search starts a custom job with the typed query", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("textbox", { name: "Search services" });

  await search.fill("piano tuning");
  await expect(page.getByText("No category found", { exact: true })).toBeVisible();
  const customAction = page.getByRole("button", { name: "Create a custom job", exact: true });
  await expect(customAction).toHaveCount(1);
  await customAction.click();

  await expect(page).toHaveURL(/category=custom&custom_query=piano\+tuning/);
  await expect(page.getByRole("heading", { name: "Tag your custom job" })).toBeVisible();
});

test("booking a provider starts the full requirements flow at step 2", async ({ page }) => {
  await page.goto("/questionnaire?provider=test-provider&providerCategory=cleaning");

  await expect(page.getByRole("heading", { name: "Specify your need" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Regular cleaning" })).toBeVisible();
});

test("shift-enabled provider profile shows the availability badge", async ({ page, request }) => {
  const response = await request.get("/api/providers?limit=20");
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  const provider = payload.providers?.find((item: { availableForShifts?: boolean }) => item.availableForShifts);
  test.skip(!provider, "No shift-enabled provider is available in the test data.");

  await page.goto(`/providers/${provider.slug}`);
  await expect(page.getByText("Available for work shifts", { exact: true }).first()).toBeVisible();
});
