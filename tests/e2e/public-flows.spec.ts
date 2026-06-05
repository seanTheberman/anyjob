import { expect, type Page, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/search-categories**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        results: [
          {
            type: "category",
            slug: "menage",
            name: "Cleaning",
            color: "#EC4899",
          },
        ],
      }),
    })
  );

  await page.route("**/*", (route) => {
    const blockedTypes = new Set(["font", "image", "media"]);
    if (blockedTypes.has(route.request().resourceType())) {
      return route.abort();
    }
    return route.continue();
  });
});

async function gotoApp(page: Page, path: string) {
  await page.goto(path, { waitUntil: "load" });
}

test.describe("public flows", () => {
  test("home page renders core navigation and service search", async ({ page }) => {
    await gotoApp(page, "/");

    await expect(page.getByRole("banner").getByRole("link", { name: "AnyJob" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Request custom service" })).toBeVisible();

    const searchInput = page.getByRole("textbox", { name: "Search services" });
    await expect(searchInput).toBeVisible();
    await searchInput.click();
    await searchInput.pressSequentially("clean");

    await expect(page.getByText("Suggestions")).toBeVisible();
    await expect(page.getByRole("button", { name: /Cleaning/i }).first()).toBeVisible();
  });

  test("service search can open the questionnaire", async ({ page }) => {
    await gotoApp(page, "/");

    const searchInput = page.getByRole("textbox", { name: "Search services" });
    await searchInput.click();
    await searchInput.pressSequentially("clean");
    await page.getByRole("button", { name: /Cleaning/i }).first().click();

    await expect(page).toHaveURL(/\/questionnaire\?category=menage/);
    await expect(page.getByRole("heading", { name: /What service are you looking for/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cleaning" })).toBeVisible();
  });

  test("search catalogue and login pages are reachable from navigation", async ({ page }) => {
    await gotoApp(page, "/");

    const isMobile = (page.viewportSize()?.width || 0) < 1024;
    if (isMobile) {
      await page.getByRole("button", { name: /menu/i }).click();
      await page.getByRole("dialog").getByRole("link", { name: "Find a Provider" }).click();
    } else {
      await page.getByRole("banner").getByRole("link", { name: "Find a Provider" }).click();
    }
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByText(/More comfort, more freedom/i)).toBeVisible();

    await gotoApp(page, "/");
    if (isMobile) {
      await page.getByRole("button", { name: /menu/i }).click();
      await page.getByRole("dialog").getByRole("link", { name: "Login" }).click();
    } else {
      await page.getByRole("banner").getByRole("link", { name: "Login" }).click();
    }
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    await expect(page.getByPlaceholder("your@email.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
  });
});
