import { expect, test } from "@playwright/test";
import { deleteHomeTestEvents, superAdminCookie, uniqueId } from "./helpers";

test.use({ viewport: { width: 360, height: 900 } });
test.beforeEach(deleteHomeTestEvents);
test.afterEach(deleteHomeTestEvents);

test("keeps homepage layout shift below the Lighthouse threshold", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!shift.hadRecentInput) (window as unknown as { __cls: number }).__cls += shift.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  await page.goto("/", { waitUntil: "networkidle" });
  const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
  expect(cls).toBeLessThan(0.1);
});

test("staggers cards, fills the viewport with pattern, scales type and disables motion", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const firstCard = page.locator("dl.grid > div").first();
  expect(await firstCard.evaluate((el) => getComputedStyle(el).animationName)).toBe("rise-in");
  expect(await page.locator("dl.grid > div").nth(1).evaluate((el) => getComputedStyle(el).animationDelay)).not.toBe(
    "0s",
  );

  const pattern = await page.locator(".pattern-surface").evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(pattern).toContain("radial-gradient");
  expect(pattern).toContain("linear-gradient");

  const paddingLeft = (selector: string) =>
    page.locator(selector).first().evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
  const titleSize = () =>
    page.locator(".display-title").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const hasNoOverflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

  const mainGutter = await paddingLeft("main");
  expect(await paddingLeft("header > div")).toBe(mainGutter);
  expect(await paddingLeft("footer > div:first-child")).toBe(mainGutter);
  expect(await titleSize()).toBeGreaterThanOrEqual(60);
  expect(await hasNoOverflow()).toBe(true);

  await page.setViewportSize({ width: 1280, height: 900 });
  expect(await titleSize()).toBeGreaterThanOrEqual(96);
  const patternWidth = await page.locator(".pattern-surface").evaluate((el) => el.getBoundingClientRect().width);
  expect(patternWidth).toBe(await page.evaluate(() => window.innerWidth));
  expect(await hasNoOverflow()).toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  expect(await firstCard.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});

test("shows a newly published event on the cached homepage", async ({ page }) => {
  await page.goto("/");
  const title = `E2E Home Event ${uniqueId()}`;
  const cookie = await superAdminCookie();
  await page.context().addCookies([{ name: "authjs.session-token", value: cookie, domain: "localhost", path: "/" }]);

  await page.goto("/admin/events");
  const createForm = page.locator("section").filter({ has: page.getByRole("heading", { name: "Create an event" }) });
  await createForm.getByLabel("Title").fill(title);
  await createForm.getByLabel("Description").fill("A regression event for homepage cache invalidation.");
  await createForm.getByLabel("Starts at (UTC)").fill(new Date(Date.now() + 60_000).toISOString().slice(0, 16));
  await createForm.getByLabel("Status").selectOption("PUBLISHED");
  await createForm.getByRole("button", { name: "Create event" }).click();

  await expect
    .poll(async () => {
      await page.goto(`/?t=${Date.now()}`);
      return page.getByRole("heading", { name: title }).isVisible();
    }, { timeout: 15_000 })
    .toBe(true);
});
