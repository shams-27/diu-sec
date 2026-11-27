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

test("applies scoped editorial brutalism only to public pages", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const hero = page.locator(".hero-surface").first();
  expect(await hero.evaluate((el) => getComputedStyle(el).borderRadius)).toBe("0px");
  expect(await hero.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("6px");
  expect(await hero.evaluate((el) => getComputedStyle(el).boxShadow)).toContain("6px 6px");

  const stat = page.locator("dl.grid > div").first();
  expect(await stat.evaluate((el) => getComputedStyle(el).borderRadius)).toBe("0px");

  const title = page.locator(".section-title").first();
  expect(await title.evaluate((el) => getComputedStyle(el).borderBottomWidth)).toBe("2px");

  await page.getByRole("button", { name: "Menu" }).click();
  const dialog = page.getByRole("dialog", { name: "Quick links" });
  expect(await dialog.evaluate((el) => getComputedStyle(el).borderRadius)).toBe("0px");
  expect(await dialog.evaluate((el) => getComputedStyle(el).borderRightWidth)).toBe("4px");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await page.goto("/committee", { waitUntil: "networkidle" });
  expect(await page.locator(".card-lift").first().evaluate((el) => getComputedStyle(el).borderRadius)).toBe("0px");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  const cookie = await superAdminCookie();
  await page.context().addCookies([{ name: "authjs.session-token", value: cookie, domain: "localhost", path: "/" }]);
  await page.goto("/admin", { waitUntil: "networkidle" });
  expect(await page.locator("main .admin-banner").first().evaluate((el) => getComputedStyle(el).borderRadius)).not.toBe(
    "0px",
  );
});

test("shows a bigger upcoming-event banner in the hero", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const banner = page.getByRole("complementary", { name: "Next event" });
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("DIU SEC Freshers Hackathon 2026");
  await expect(banner.getByRole("link", { name: /Event details/ })).toBeVisible();
  expect(await page.locator(".brutal-stats > div").first().evaluate((el) => getComputedStyle(el).borderLeftWidth)).toBe(
    "6px",
  );

  await page.setViewportSize({ width: 1280, height: 900 });
  const bannerBox = await banner.boundingBox();
  // The h1 block spans the whole text column; measure its rendered text instead.
  const titleTextRight = await page.locator(".display-title").first().evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect().right;
  });
  expect(bannerBox).not.toBeNull();
  expect(bannerBox!.width).toBeGreaterThanOrEqual(300);
  expect(bannerBox!.x).toBeGreaterThan(titleTextRight);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("gives impact cards the shared hard shadow and bigger numbers", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const impact = page.locator(".brutal-stats > div").first();
  const other = page.locator('section[aria-labelledby="manifesto-heading"] .card-lift').first();
  expect(await impact.evaluate((el) => getComputedStyle(el).boxShadow)).toBe(
    await other.evaluate((el) => getComputedStyle(el).boxShadow),
  );

  const stat = page.locator(".brutal-stats dd").first();
  const fontSize = async () => stat.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const noClipping = async () => stat.evaluate((el) => el.scrollWidth <= el.clientWidth);
  const noPageOverflow = async () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

  expect(await fontSize()).toBeGreaterThanOrEqual(40);
  expect(await noClipping()).toBe(true);
  expect(await noPageOverflow()).toBe(true);

  await page.setViewportSize({ width: 768, height: 900 });
  expect(await noClipping()).toBe(true);
  expect(await noPageOverflow()).toBe(true);

  await page.setViewportSize({ width: 1280, height: 900 });
  expect(await fontSize()).toBeGreaterThanOrEqual(60);
  expect(await noPageOverflow()).toBe(true);
});

test("shuffles impact digits on visit and settles for reduced motion", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const visual = page.locator(".brutal-stats dd span[aria-hidden='true']").first();
  await expect(page.locator(".brutal-stats dd .sr-only").first()).toHaveText("1,200+");
  await expect(visual).toHaveText("1,200+");

  const recorded = page.evaluate(
    () =>
      new Promise<string[]>((resolve) => {
        const el = document.querySelector(".brutal-stats dd span[aria-hidden='true']");
        if (!el) return resolve([]);
        const seen: string[] = [];
        const capture = () => {
          const text = el.textContent ?? "";
          if (seen[seen.length - 1] !== text) seen.push(text);
        };
        capture();
        const observer = new MutationObserver(capture);
        observer.observe(el, { childList: true, characterData: true, subtree: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(seen);
        }, 2000);
      }),
  );

  await page.locator(".brutal-stats").scrollIntoViewIfNeeded();
  const seen = await recorded;
  expect(seen.some((text) => text !== "1,200+")).toBe(true);
  for (const text of seen) {
    expect(text).toHaveLength("1,200+".length);
    expect(text.replace(/\d/g, "")).toBe(",+");
  }
  await expect(visual).toHaveText("1,200+", { timeout: 2000 });

  await page.addInitScript(() => {
    (window as unknown as { __statTexts: string[] }).__statTexts = [];
    document.addEventListener("DOMContentLoaded", () => {
      const el = document.querySelector(".brutal-stats dd span[aria-hidden='true']");
      if (!el) return;
      new MutationObserver(() => {
        (window as unknown as { __statTexts: string[] }).__statTexts.push(el.textContent ?? "");
      }).observe(el, { childList: true, characterData: true, subtree: true });
    });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".brutal-stats").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as unknown as { __statTexts: string[] }).__statTexts)).toEqual([]);
  await expect(visual).toHaveText("1,200+");
});

test("keeps admin metric numbers on their original scale", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const cookie = await superAdminCookie();
  await page.context().addCookies([{ name: "authjs.session-token", value: cookie, domain: "localhost", path: "/" }]);
  await page.goto("/admin", { waitUntil: "networkidle" });
  const size = await page
    .locator("main .stat-value")
    .first()
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBe(48);
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

  const patternAnimation = await page.locator(".pattern-surface").evaluate((el) => {
    const styles = getComputedStyle(el);
    return { name: styles.animationName, duration: styles.animationDuration };
  });
  expect(patternAnimation).toEqual({ name: "pattern-drift", duration: "8s" });
  const initialPosition = await page.locator(".pattern-surface").evaluate((el) => getComputedStyle(el).backgroundPosition);
  await page.waitForFunction(
    (initial) => getComputedStyle(document.querySelector(".pattern-surface")!).backgroundPosition !== initial,
    initialPosition,
  );
  expect(
    await page.locator(".hero-surface").first().evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");

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
  expect(await page.locator(".pattern-surface").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
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

test("uses the club logo instead of text branding in the public shell", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const headerLogo = page.locator("header a[href='/'] img");
  const footerLogo = page.locator("footer img");
  for (const logo of [headerLogo, footerLogo]) {
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", "/sec_logo.png");
    await expect(logo).toHaveAttribute("alt", "DIU SEC");
    await expect(logo).toHaveAttribute("width", "82");
    await expect(logo).toHaveAttribute("height", "40");
    expect(await logo.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(82);
  }

  await expect(page.locator("header a[href='/']")).toHaveAccessibleName("DIU SEC");
  await expect(page.getByText("DIU SEC", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.evaluate(() => document.documentElement.classList.add("dark"));
  const chip = await headerLogo.evaluate((el) => getComputedStyle(el.parentElement!).backgroundColor);
  expect(chip).toBe("rgb(255, 255, 255)");
});
