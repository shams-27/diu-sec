# Editorial Brutalism Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a scoped editorial-brutalist treatment to the public pages while keeping the blue DIU SEC identity, accessibility, and performance budget intact.

**Architecture:** One `public-brutal` wrapper class in the public layout scopes an unlayered CSS block in `globals.css`; it overrides Tailwind radii with square corners, adds 2px foreground rules and hard offset shadows, and strengthens mono labels without new dependencies. The homepage gets one static asymmetric callout and a ruled impact grid; admin routes remain untouched because they live under a separate layout.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS 4, CSS custom properties, Playwright e2e, Lighthouse.

**Spec:** `docs/superpowers/specs/2026-11-27-editorial-brutalism-design.md`

## Global Constraints

- Public pages only: the `(public)` route group and shared public shell components.
- Admin panel, auth, and all server behavior are unchanged.
- No pure red/yellow/blue full-brute palette; navy/blue/white stays, red remains destructive only.
- No new dependency, no page-content rewrite outside the homepage callout, no change to admin UI.
- No animation on the home hero or LCP text.
- WCAG AA text contrast and visible focus rings remain unchanged.
- Mobile-first ≥360px with no horizontal overflow.
- Lighthouse accessibility 100, CLS 0, LCP under 1s must be preserved.
- All colours come from CSS variables; no new hard-coded hex in components.

## Review Focus

- 360px public pages: squared surfaces must not overflow or clip text — Task 1 e2e checks `scrollWidth <= innerWidth` on `/` and `/committee`.
- 1280px homepage: the asymmetric callout must sit beside, not over, the hero title — Task 2 e2e compares bounding boxes.
- Admin isolation: `.admin-banner` must keep its existing radius — Task 1 e2e asserts it is not `0px` after authentication.
- Native dialog: squaring the drawer must not break full height or dismissal — Task 1 e2e asserts `borderRightWidth`, Escape dismissal, and existing full-height test stays green.
- Motion/CLS: new borders must not re-enable motion or add layout shift — Task 2 reruns the existing CLS and reduced-motion e2e tests plus Lighthouse.

---

### Task 1: Scoped brutalist surface system

**Files:**
- Modify: `src/app/(public)/layout.tsx:6`
- Modify: `src/app/globals.css` (append unlayered block after `@layer components`)
- Modify: `e2e/home.spec.ts` (add one test after the existing drawer test)
- Modify: `docs/design-system.md` (component notes)
- Modify: `docs/DECISIONS.md` (append decision #61)

**Interfaces:**
- Consumes: existing classes `.hero-surface`, `.card-lift`, `.section-title`, `.eyebrow`, `.pill`, `.nav-drawer`; existing helper `superAdminCookie()` from `e2e/helpers.ts`.
- Produces: `.public-brutal` wrapper class on the public layout; all rules below are scoped to descendants of that class.

- [ ] **Step 1: Write the failing e2e test**

Add this test to `e2e/home.spec.ts`:

```ts
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
  expect(await page.locator(".admin-banner").first().evaluate((el) => getComputedStyle(el).borderRadius)).not.toBe("0px");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "applies scoped editorial brutalism"`

Expected: FAIL on `borderRadius` because the public layout has no `.public-brutal` wrapper and no brutalist CSS.

- [ ] **Step 3: Add the public wrapper**

In `src/app/(public)/layout.tsx`, add `public-brutal` to the outer `div` className alongside `pattern-surface flex min-h-screen flex-col`. Do not change any other class or markup.

- [ ] **Step 4: Append the scoped CSS block**

Append this unlayered block at the end of `src/app/globals.css` so it wins over Tailwind's utility layer:

```css
/* Public-only editorial brutalism: token colours, square surfaces, hard rules. */
.public-brutal,
.public-brutal * {
  border-radius: 0;
}
.public-brutal :is(.hero-surface, .card-lift) {
  border: 2px solid var(--foreground);
  box-shadow: 6px 6px 0 var(--primary);
}
.public-brutal .hero-surface {
  border-top-width: 6px;
}
.public-brutal .card-lift:hover,
.public-brutal .card-lift:focus-within {
  box-shadow: 8px 8px 0 var(--primary);
}
.public-brutal .section-title {
  border-bottom: 2px solid var(--foreground);
  padding-bottom: 0.25rem;
}
.public-brutal .eyebrow {
  font-weight: 800;
  letter-spacing: 0.24em;
}
.public-brutal .pill {
  border-width: 2px;
  border-color: var(--foreground);
}
.public-brutal [class*="bg-primary"] {
  border: 2px solid var(--foreground);
}
.public-brutal .nav-drawer {
  border-right: 4px solid var(--foreground);
  box-shadow: 8px 0 0 var(--primary);
}
```

Keep every colour as a `var(--token)`; do not add hex values.

- [ ] **Step 5: Update docs**

In `docs/design-system.md`, add a bullet to the utility/component notes:

```md
- `.public-brutal` — scoped public wrapper: square corners, 2px foreground rules, hard primary offset shadows and heavier mono labels. Admin routes keep their original rounded surfaces.
```

Append to `docs/DECISIONS.md`:

```md
| 61 | 2026-11-27 | Added a public-only editorial-brutalism layer: square surfaces, 2px ink rules, hard offset shadows and heavier mono labels; admin pages stay unchanged | The partner asked for a touch of brutalism on public pages only; a scoped wrapper keeps the blue identity and avoids restyling admin. |
```

- [ ] **Step 6: Run the focused test to verify it passes**

Run: `set -a; . ./.env; set +a; pnpm build && pnpm e2e --grep "applies scoped editorial brutalism"`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(public)/layout.tsx" src/app/globals.css e2e/home.spec.ts docs/design-system.md docs/DECISIONS.md
git commit -m "feat(ui): add scoped brutalist public surfaces"
```

### Task 2: Asymmetric homepage hero and ruled impact grid

**Files:**
- Modify: `src/app/globals.css` (append two rules inside the existing `.public-brutal` block area)
- Modify: `src/app/(public)/page.tsx:142-183` (hero callout and impact grid class)
- Modify: `e2e/home.spec.ts` (add one test after Task 1's test)
- Modify: `docs/design-system.md` (callout/stat notes)
- Modify: `docs/DECISIONS.md` (append decision #62)

**Interfaces:**
- Consumes: `.public-brutal` wrapper from Task 1 and the existing `Link` import in `src/app/(public)/page.tsx`.
- Produces: `.brutal-callout` and `.brutal-stats` class names used only by the homepage.

- [ ] **Step 1: Write the failing e2e test**

Add this test to `e2e/home.spec.ts`:

```ts
test("adds an asymmetric hero callout and ruled impact grid", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const callout = page.getByRole("complementary", { name: "Club snapshot" });
  await expect(callout).toBeHidden();
  expect(await page.locator(".brutal-stats > div").first().evaluate((el) => getComputedStyle(el).borderLeftWidth)).toBe(
    "6px",
  );

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(callout).toBeVisible();
  const calloutBox = await callout.boundingBox();
  const titleBox = await page.locator(".display-title").first().boundingBox();
  expect(calloutBox).not.toBeNull();
  expect(titleBox).not.toBeNull();
  expect(calloutBox!.x).toBeGreaterThan(titleBox!.x + titleBox!.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "asymmetric hero callout"`

Expected: FAIL because `.brutal-callout` and `.brutal-stats` do not exist.

- [ ] **Step 3: Add the homepage markup**

In `src/app/(public)/page.tsx`, after the closing `</div>` of the hero's `max-w-3xl` content block and before the hero `</section>`, insert:

```tsx
<aside
  aria-label="Club snapshot"
  className="brutal-callout absolute right-10 top-10 hidden w-48 bg-primary p-4 text-primary-foreground xl:block"
>
  <p className="font-mono text-xs font-bold uppercase tracking-[0.2em]">Next up</p>
  <p className="mt-6 font-heading text-4xl leading-none">05 wings</p>
  <Link
    href="/wings"
    className="mt-6 inline-block border-t-2 border-current pt-2 font-mono text-xs font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    Explore →
  </Link>
</aside>
```

Change the impact `<dl>` className from `"stagger-in grid grid-cols-2 gap-4 md:grid-cols-4"` to `"brutal-stats stagger-in grid grid-cols-2 gap-4 md:grid-cols-4"`. Do not change animation classes or copy.

- [ ] **Step 4: Add the CSS rules**

Append to the `.public-brutal` CSS block from Task 1:

```css
.public-brutal .brutal-stats > div {
  border-left: 6px solid var(--primary);
  box-shadow: 4px 4px 0 var(--primary);
}
.public-brutal .brutal-callout {
  border: 2px solid var(--foreground);
  box-shadow: 6px 6px 0 var(--foreground);
}
```

- [ ] **Step 5: Update docs**

In `docs/design-system.md`, add:

```md
- `.brutal-callout` / `.brutal-stats` — static solid-blue hero callout and ruled impact grid; no extra data fetch, so the LCP path stays unchanged.
```

Append to `docs/DECISIONS.md`:

```md
| 62 | 2026-11-27 | Home hero gets a static solid-blue "Next up" callout and the impact grid gets ruled 6px left borders | Editorial asymmetry without another DB read; static SSR keeps the protected LCP budget. |
```

- [ ] **Step 6: Run focused verification**

Run: `set -a; . ./.env; set +a; pnpm build && pnpm e2e --grep "asymmetric hero callout|applies scoped editorial brutalism|layout shift|zeroes page transition animations"`

Expected: all four tests PASS.

- [ ] **Step 7: Run the full gate**

Run: `set -a; . ./.env; set +a; pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e && git diff --check`

Expected: all commands PASS; 151 unit tests and 13 e2e tests (11 existing + the Task 1 and Task 2 tests).

- [ ] **Step 8: Check Lighthouse on the production build**

Run: `set -a; . ./.env; set +a; pnpm start --port 3003 & CHROME_PATH=$(node -e "console.log(require('@playwright/test').chromium.executablePath())") npx --yes lighthouse http://localhost:3003 --chrome-flags="--headless=new --no-sandbox --disable-gpu" --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=/tmp/opencode/brutalism-lighthouse.json --quiet`

Then read the scores from `/tmp/opencode/brutalism-lighthouse.json`.

Expected: accessibility 100, CLS `0`, LCP `< 1000` ms. Performance should remain ≥ 90.

- [ ] **Step 9: Commit**

```bash
git add src/app/globals.css "src/app/(public)/page.tsx" e2e/home.spec.ts docs/design-system.md docs/DECISIONS.md
git commit -m "feat(ui): add editorial homepage brutalism"
```
