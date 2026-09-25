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
    await expect(page.getByRole("heading", { name: /What do you need help with/i })).toBeVisible();

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
    await expect(page.getByRole("heading", { name: "Specify your need" })).toBeVisible();
    await expect(page.getByText("Cleaning", { exact: true }).first()).toBeVisible();
  });

  test("search catalogue and login pages are reachable from navigation", async ({ page }) => {
    await gotoApp(page, "/");

    const isMobile = (page.viewportSize()?.width || 0) < 1024;
    if (isMobile) {
      await page.getByRole("button", { name: /menu/i }).click();
      await page.getByRole("dialog").getByRole("link", { name: "Find a Jobber" }).click();
    } else {
      await page.getByRole("banner").getByRole("link", { name: "Find a Jobber" }).click();
    }
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByRole("heading", { name: "What do you need done?" })).toBeVisible();

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

  test("hero job mode options are side-by-side on mobile without overlapping", async ({ page }) => {
    await gotoApp(page, "/");

    const dayToDayLabel = page.locator("label", { hasText: "Find a Jobber" });
    const workShiftsLabel = page.locator("label", { hasText: "Hire for Shifts" });

    await expect(dayToDayLabel).toBeVisible();
    await expect(workShiftsLabel).toBeVisible();

    const dayBox = await dayToDayLabel.boundingBox();
    const shiftBox = await workShiftsLabel.boundingBox();

    expect(dayBox).not.toBeNull();
    expect(shiftBox).not.toBeNull();

    if (dayBox && shiftBox) {
      // They should be on roughly the same horizontal line (center Y within 20px)
      const dayCenterY = dayBox.y + dayBox.height / 2;
      const shiftCenterY = shiftBox.y + shiftBox.height / 2;
      expect(Math.abs(dayCenterY - shiftCenterY)).toBeLessThan(20);

      // They should not overlap horizontally
      const dayRight = dayBox.x + dayBox.width;
      const shiftRight = shiftBox.x + shiftBox.width;
      const overlap = Math.max(0, Math.min(dayRight, shiftRight) - Math.max(dayBox.x, shiftBox.x));
      expect(overlap).toBe(0);
    }
  });

  test("client-requested public copy and work-shift flow are present", async ({ page }) => {
    await gotoApp(page, "/");

    await expect(page.getByRole("heading", { name: /What do you need help with/i })).toBeVisible();
    await expect(page.getByText("388,000+ qualified providers")).toHaveCount(0);
    await expect(page.getByText("Work shifts", { exact: true }).first()).toBeVisible();

    await page.locator("label", { hasText: "Hire for Shifts" }).click();
    await expect(page.getByPlaceholder("What shift do you need to fill?")).toBeVisible();
  });

  test("how-it-works and Jobber onboarding use the requested structure", async ({ page }) => {
    await gotoApp(page, "/how-it-works");
    await expect(page.getByRole("heading", { name: "Post a job. Find the right person. Get it done." })).toBeVisible();

    await gotoApp(page, "/become-provider");
    await expect(page.getByRole("heading", { name: "See what you could earn on AnyJob" })).toBeVisible();
    await expect(page.getByText("Example hourly rate")).toBeVisible();
    await expect(page.getByRole("button", { name: /Individual Jobber/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Business or Team/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Quote for projects/i })).toBeVisible();
  });

  test("categories keep Work Shifts separate from service categories", async ({ page }) => {
    await gotoApp(page, "/");

    const isMobile = (page.viewportSize()?.width || 0) < 1024;
    if (isMobile) {
      await page.getByRole("button", { name: /menu/i }).click();
      await page.getByRole("button", { name: "Categories" }).click();
    } else {
      await page.getByRole("button", { name: "Categories" }).click();
    }

    await expect(page.getByText("Work Shifts", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Service categories", { exact: true })).toBeVisible();
    await expect(page.getByText("Hire for shifts", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Find shift work", { exact: true }).first()).toBeVisible();
  });
});
