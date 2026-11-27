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

test("keeps all quick links in an accessible drawer", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
  await expect(page.locator("header").getByRole("link", { name: "Join Now" })).toBeVisible();
  const menuButton = page.getByRole("button", { name: "Menu" });
  await expect(page.locator("header a, header button").first()).toHaveAttribute("aria-label", "Menu");
  await expect(menuButton.locator("svg")).toBeVisible();

  await page.getByRole("button", { name: "Menu" }).click();
  const dialog = page.getByRole("dialog", { name: "Quick links" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link")).toHaveCount(14);
  await expect(dialog.getByRole("link", { name: "Committee" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Contact" })).toBeVisible();
  const dialogBox = await dialog.boundingBox();
  expect(dialogBox?.y).toBe(0);
  expect(dialogBox && Math.round(dialogBox.y + dialogBox.height)).toBe(await page.evaluate(() => innerHeight));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await dialog.getByRole("button", { name: "Close quick links" }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "Menu" }).click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "Menu" }).click();
  await dialog.getByRole("link", { name: "Events" }).click();
  await expect(page).toHaveURL(/\/events$/);
  await expect(dialog).toBeHidden();
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

  const expectFullWidthLayout = async () => {
    const mainGutter = await paddingLeft("main");
    expect(await paddingLeft("header > div")).toBe(mainGutter);
    expect(await paddingLeft("footer > div:first-child")).toBe(mainGutter);
    const patternWidth = await page.locator(".pattern-surface").evaluate((el) => el.getBoundingClientRect().width);
    expect(patternWidth).toBe(await page.evaluate(() => window.innerWidth));
    expect(await hasNoOverflow()).toBe(true);
  };

  expect(await titleSize()).toBeGreaterThanOrEqual(60);
  await expectFullWidthLayout();

  await page.setViewportSize({ width: 1280, height: 900 });
  const mainContentWidth = await page.locator("main").evaluate((el) => {
    const styles = getComputedStyle(el);
    return el.getBoundingClientRect().width - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
  });
  expect(mainContentWidth).toBeGreaterThanOrEqual(1100);
  expect(await titleSize()).toBeGreaterThanOrEqual(96);
  await expectFullWidthLayout();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  expect(await firstCard.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});

test("keeps larger page titles inside the viewport", async ({ page }) => {
  await page.goto("/committee", { waitUntil: "networkidle" });
  await expect(page.locator(".page-title")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.setViewportSize({ width: 1280, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("runs a page transition when a drawer link is clicked", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as Window & {
      __viewTransitions?: number;
      __transitionClasses?: string[];
      __animations?: string[];
    };
    w.__viewTransitions = 0;
    w.__transitionClasses = [];
    w.__animations = [];
    new MutationObserver((records) => {
      for (const record of records) {
        const className = (record.target as HTMLElement).style?.viewTransitionClass;
        if (className && className !== "none") w.__transitionClasses?.push(className);
      }
    }).observe(document, { attributes: true, attributeFilter: ["style"], subtree: true });
    const original = document.startViewTransition?.bind(document);
    document.startViewTransition = ((callback: () => void) => {
      w.__viewTransitions = (w.__viewTransitions ?? 0) + 1;
      const result = original ? original(callback) : Promise.resolve();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          for (const animation of document.getAnimations()) {
            const name = (animation as CSSAnimation).animationName;
            if (name) w.__animations?.push(name);
          }
        }),
      );
      return result;
    }) as typeof document.startViewTransition;
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const count = () => page.evaluate(() => (window as Window & { __viewTransitions?: number }).__viewTransitions ?? 0);
  const beforeNav = await count();

  await page.getByRole("button", { name: "Menu" }).click();
  await page
    .getByRole("dialog", { name: "Quick links" })
    .getByRole("link", { name: "Events" })
    .click();
  await expect(page).toHaveURL(/\/events$/);
  expect(await count()).toBeGreaterThan(beforeNav);
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { __animations?: string[] }).__animations?.includes("page-fade-in") ?? false),
    )
    .toBe(true);

  const observed = await page.evaluate(() => {
    const w = window as Window & { __transitionClasses?: string[]; __animations?: string[] };
    return { classes: w.__transitionClasses ?? [], animations: w.__animations ?? [] };
  });
  expect(observed.classes).toContain("page-fade");
  expect(observed.animations).toContain("page-fade-in");
  expect(observed.animations).not.toContain("-ua-view-transition-group-anim-public-page");
});

test("zeroes page transition animations for reduced-motion users", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });

  const duration = await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSMediaRule && rule.conditionText.includes("prefers-reduced-motion")) {
          for (const inner of Array.from(rule.cssRules)) {
            if (inner instanceof CSSStyleRule && inner.selectorText.includes("::view-transition-new(*)")) {
              return inner.style.getPropertyValue("animation-duration").trim();
            }
          }
        }
      }
    }
    return "";
  });
  expect(duration).toBe("0s");
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
