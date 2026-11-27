# Hero Event Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home hero's static "05 wings" callout with a bigger, data-driven banner for the next published event, including one in progress.

**Architecture:** Extend the existing cached highlights query with one `nextEvent` (published, not ended, soonest start) plus its `now` timestamp. Render an async `HeroEventBanner` in its own Suspense boundary inside the hero, with the same wrapper classes on fallback and content so mobile layout does not shift. The hero `h1` stays static.

**Tech Stack:** Next 16 App Router, React 19 Suspense, Tailwind 4, Prisma 6, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-28-hero-event-banner-design.md`

## Global Constraints

- Do not add dependencies or client JS.
- Hero `h1` stays static (decision #53); CLS must remain below 0.1 (existing e2e).
- Reuse `.brutal-callout`, `.pill`, `SectionTitle` and existing UTC date formatting.
- Frontend never imports Prisma; backend never imports frontend.
- Empty state must link to `/events`.
- Reduced motion unchanged; no new animation.
- `docs/DECISIONS.md` gets one new row.

## Review Focus

- **No published event:** banner shows "Nothing scheduled" and a `/events` link, not a crash — Task 2 Step 1 pins the empty copy in the e2e only if cheap; otherwise code review only (seeded DB always has an event).
- **Already-started event:** an event whose `startsAt` is past but `endsAt` is future must be selected and labelled "Happening now" — Task 1 Step 1 pins the `endsAt` filter and Task 2 Step 3 pins the label from `nowIso`.
- **Ended event excluded:** the past seeded "Modern Web Workshop 2026" must never be selected — Task 1 Step 1 asserts `endsAt >= now`.
- **Mobile width and CLS:** banner visible at 360px, in flow, no horizontal overflow; fallback and real banner share classes — Task 2 Step 1 asserts visibility/no-overflow and Task 2 Step 5 runs the CLS e2e.
- **Desktop geometry:** banner is to the right of the title and at least 300px wide — Task 2 Step 1 asserts both.

---

### Task 1: Add `nextEvent` to the cached highlights query

**Files:**
- Modify: `src/backend/features/home/queries.ts:5-30`
- Test: `tests/home-query.test.ts` (new)

**Interfaces:**
- Consumes: `db.event`, `db.wing` from `@/backend/shared/db`; `cacheLife`, `cacheTag` from `next/cache`.
- Produces: `getHomeHighlights()` returns `{ upcoming, wings, nextEvent, nowIso }` where `nextEvent` has `{ id, slug, title, type, startsAt, endsAt, capacity, seatsTaken }` or `null`, and `nowIso` is a string.

- [ ] **Step 1: Write the failing test**

Create `tests/home-query.test.ts` following `tests/events-query.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  wingFindMany: vi.fn(),
}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/backend/shared/db", () => ({
  db: {
    event: { findMany: m.findMany, findFirst: m.findFirst },
    wing: { findMany: m.wingFindMany },
  },
}));
vi.mock("@/backend/shared/cache-tags", () => ({ HOME_HIGHLIGHTS_TAG: "home-highlights" }));

import { getHomeHighlights } from "@/backend/features/home/queries";

describe("getHomeHighlights nextEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.findMany.mockResolvedValue([]);
    m.wingFindMany.mockResolvedValue([]);
    m.findFirst.mockResolvedValue(null);
  });

  it("selects the soonest event that has not ended", async () => {
    await getHomeHighlights();
    const args = m.findFirst.mock.calls[0][0];
    expect(args.where.status).toBe("PUBLISHED");
    expect(args.where.endsAt.gte).toBeInstanceOf(Date);
    expect(args.orderBy).toEqual({ startsAt: "asc" });
    expect(args.take).toBe(1);
  });

  it("returns the selected event and its reference time", async () => {
    const event = {
      id: "e1", slug: "demo", title: "Demo", type: "HACKATHON",
      startsAt: new Date("2026-11-28T00:00:00Z"), endsAt: new Date("2026-11-29T00:00:00Z"),
      capacity: 10, seatsTaken: 2,
    };
    m.findFirst.mockResolvedValue(event);
    const result = await getHomeHighlights();
    expect(result.nextEvent).toEqual(event);
    expect(Date.parse(result.nowIso)).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- tests/home-query.test.ts`
Expected: FAIL — `result.nextEvent` is `undefined` and `findFirst` was never called.

- [ ] **Step 3: Implement the query change**

In `getHomeHighlights()`, create `const now = new Date();`, add a third `db.event.findFirst(...)` call to the existing `Promise.all` with the exact `where`, `orderBy`, `take` and `select` asserted above. Return `{ upcoming, wings, nextEvent, nowIso: now.toISOString() }`. Keep `cacheLife`, `cacheTag` and both existing reads unchanged.

- [ ] **Step 4: Run the test and full gates to verify they pass**

Run: `pnpm test -- tests/home-query.test.ts && pnpm lint && pnpm typecheck`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/backend/features/home/queries.ts tests/home-query.test.ts
git commit -m "feat(home): select next published event for hero banner"
```

---

### Task 2: Replace the hero callout with the event banner

**Files:**
- Modify: `e2e/home.spec.ts:89-106`
- Modify: `src/frontend/features/home/home-page.tsx:108-151`
- Modify: `docs/DECISIONS.md`
- Create (already written, commit here): `docs/superpowers/specs/2026-11-28-hero-event-banner-design.md`, `docs/superpowers/plans/2026-11-28-hero-event-banner.md`

**Interfaces:**
- Consumes: `getHomeHighlights()` returning `{ nextEvent, nowIso }` from Task 1.
- Produces: an `<aside aria-label="Next event">` in the hero; e2e selectors `getByRole("complementary", { name: "Next event" })` and link name `Event details`.

- [ ] **Step 1: Write the failing e2e test**

Replace the test at `e2e/home.spec.ts:89-106` with:

```ts
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
  const titleBox = await page.locator(".display-title").first().boundingBox();
  expect(bannerBox).not.toBeNull();
  expect(titleBox).not.toBeNull();
  expect(bannerBox!.width).toBeGreaterThanOrEqual(300);
  expect(bannerBox!.x).toBeGreaterThan(titleBox!.x + titleBox!.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "bigger upcoming-event banner"`
Expected: FAIL — no complementary landmark named "Next event".

- [ ] **Step 3: Implement the banner**

In `src/frontend/features/home/home-page.tsx`:

- Add `const HERO_BANNER_CLASS = "brutal-callout mt-8 min-h-60 w-full max-w-3xl bg-primary p-5 text-primary-foreground xl:absolute xl:right-10 xl:top-10 xl:mt-0 xl:w-80";`.
- Add an async `HeroEventBanner()` that calls `getHomeHighlights()`, computes `const ongoing = nextEvent ? nextEvent.startsAt.getTime() <= Date.parse(nowIso) : false;`, and returns an `<aside aria-label="Next event" className={HERO_BANNER_CLASS}>`. With an event, render the label `Next event`, the title in `font-heading text-3xl leading-tight xl:text-4xl` with `line-clamp-2`, a pill (`Happening now` when ongoing, otherwise `type.replace("_", " ")`), the UTC `startsAt` date in the same format as the event cards, remaining seats or `Full`, and a link to `/events/${nextEvent.slug}` named `Event details →`. Without an event, render `Nothing scheduled` and a `Browse events →` link to `/events`.
- Remove the existing static `<aside>` from `HomePage` and replace it with `<Suspense fallback={<div role="status" aria-live="polite" className={HERO_BANNER_CLASS}><span className="sr-only">Loading next event</span></div>}><HeroEventBanner /></Suspense>` in the same position.
- Do not change the lower `Suspense` fallback heights; the banner is in its own boundary.

- [ ] **Step 4: Run the focused e2e and gates**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "bigger upcoming-event banner" && pnpm lint && pnpm typecheck`
Expected: all pass.

- [ ] **Step 5: Add the decision, run the full suite, and commit**

Append one row to `docs/DECISIONS.md`: hero callout now shows the next published event (ongoing events included via `endsAt >= now`, ordered by `startsAt`) in a larger banner with a height-matched Suspense fallback, so the static hero keeps its LCP budget.

Run: `set -a; . ./.env; set +a; pnpm e2e && pnpm test && git diff --check`
Expected: 17/17 e2e pass (including the CLS test), 180/180 unit tests pass, no whitespace errors. If the CLS test regresses, deepen the shared fallback `min-h` until it matches.

```bash
git add e2e/home.spec.ts src/frontend/features/home/home-page.tsx docs/DECISIONS.md docs/superpowers/specs/2026-11-28-hero-event-banner-design.md docs/superpowers/plans/2026-11-28-hero-event-banner.md
git commit -m "feat(home): show next event in a bigger hero banner"
```
