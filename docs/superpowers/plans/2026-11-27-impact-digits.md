# Impact Cards and Digit Shuffle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the four public homepage impact cards the same hard shadow as other brutalist cards, larger numbers that fit every breakpoint, and a one-time random digit flicker when the cards scroll into view.

**Architecture:** CSS changes in the existing scoped `.public-brutal` block and `.stat-value` utility handle shadow and sizing. A single small client component renders each `<dd>` value with an `sr-only` final value and an `aria-hidden` visual span; an `IntersectionObserver` starts one short interval that replaces digits until the real value settles. No server or data changes.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind 4, Playwright e2e, existing CSS tokens. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-27-impact-digits-design.md`

## Global Constraints

- Public homepage only; admin panel, auth, server actions, and data untouched.
- All colours from CSS variables; no new hard-coded hex in components.
- Final numbers must remain in server HTML; the shuffle starts only after hydration.
- Reduced-motion visitors see the final value immediately; screen readers never read flicker digits.
- No horizontal overflow or clipped numbers at 360px, 768px, or 1280px; CLS stays 0.
- No new dependency; keep Lighthouse accessibility 100, LCP under 1s.
- Full gate after each task: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e && git diff --check`.
- E2E needs env loaded manually: `set -a; . ./.env; set +a; pnpm e2e`. Kill any listener on port 3003 before starting e2e.

## Review Focus

- **360px and 768px card widths:** “1,200+” must not clip inside a card — Task 1 Step 1 asserts `dd.scrollWidth <= dd.clientWidth` and no page overflow at both widths.
- **1280px headline presence:** numbers must actually grow — Task 1 Step 1 asserts computed font size ≥ 60px there and ≥ 40px at 360px.
- **Reduced-motion visitor:** no flicker, real value shown — Task 2 Step 1 emulates reduced motion, scrolls to the cards, and asserts the visual text never changes.
- **Screen reader:** only the final value is announced — Task 2 Step 1 asserts an `.sr-only` span with the real value and `aria-hidden="true"` on the animated span.
- **Flicker width/replay:** intermediate digits keep punctuation and length so nothing shifts, and each visit settles — Task 2 Step 1 records observer mutations, asserts each has the same length/punctuation, and waits for the final value.

---

### Task 1: Shared shadow and larger impact numbers

**Files:**
- Modify: `src/app/globals.css` (`.public-brutal .brutal-stats > div` and `.stat-value`)
- Modify: `src/app/(public)/page.tsx` (impact card padding)
- Modify: `e2e/home.spec.ts` (one test after the brutalist tests)
- Modify: `docs/design-system.md`, `docs/DECISIONS.md` (#63)

**Interfaces:**
- Consumes: `.card-lift` hard shadow from the `.public-brutal` block; `.stat-value` and `.brutal-stats` classes.
- Produces: impact cards with the shared `6px 6px 0 var(--primary)` shadow and hover state; `.stat-value` at `text-[2.5rem] md:text-5xl xl:text-[3.75rem]`; impact card padding `p-4`.

- [ ] **Step 1: Write the failing e2e test**

Add `test("gives impact cards the shared hard shadow and bigger numbers", ...)` to `e2e/home.spec.ts`. It must:
  1. `goto("/")`, then assert `getComputedStyle` `boxShadow` of `.brutal-stats > div` first equals that of `section[aria-labelledby="manifesto-heading"] .card-lift` first.
  2. Assert computed `fontSize` of `.brutal-stats dd` first is ≥ 40 at 360px, and `dd.scrollWidth <= dd.clientWidth` plus `document.documentElement.scrollWidth <= innerWidth` at both 360px and 768px.
  3. Resize to 1280px and assert the same `dd` computed `fontSize` is ≥ 60 and the page still has no horizontal overflow.

- [ ] **Step 2: Run the test to verify it fails**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "shared hard shadow and bigger numbers"`
Expected: FAIL on shadow equality (impact card is `4px 4px`, other card `6px 6px`).

- [ ] **Step 3: Implement CSS and markup**

In `src/app/globals.css`, remove only the `box-shadow` line from `.public-brutal .brutal-stats > div` so the card inherits the `.card-lift` shadow and hover shadow; keep its `border-left: 6px solid var(--primary)`. Change `.stat-value` to `@apply font-heading text-[2.5rem] leading-none tracking-wide tabular-nums md:text-5xl xl:text-[3.75rem];`. In `src/app/(public)/page.tsx`, change the impact card class from `p-5` to `p-4`.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "shared hard shadow and bigger numbers"`
Expected: PASS.

- [ ] **Step 5: Update docs**

Add a line to `docs/design-system.md` noting impact cards use the shared brutalist hard shadow and the larger tabular stat scale. Append decision #63 to `docs/DECISIONS.md`: impact cards share the `.card-lift` shadow; responsive stat sizes were chosen because a 4-column card at 768px cannot fit a larger font.

- [ ] **Step 6: Run the full gate and commit**

Run the full gate from Global Constraints, then:
```bash
git add src/app/globals.css "src/app/(public)/page.tsx" e2e/home.spec.ts docs/design-system.md docs/DECISIONS.md
git commit -m "feat(ui): align impact cards and enlarge stat numbers"
```

### Task 2: Scroll-triggered digit shuffle

**Files:**
- Create: `src/components/public/stat-number.tsx`
- Modify: `src/app/(public)/page.tsx` (four `<dd>` values)
- Modify: `e2e/home.spec.ts` (one test after Task 1's test)
- Modify: `docs/DECISIONS.md` (#64)

**Interfaces:**
- Consumes: `.stat-value` from Task 1; `IMPACT` values in `src/app/(public)/page.tsx`.
- Produces: `StatNumber({ value }: { value: string })`, a client component that must be used as the single child of each impact `<dd>`. It renders only `<span className="sr-only">{value}</span>` plus `<span aria-hidden="true">{display}</span>`; the caller supplies the `<dd className="stat-value mt-3">` wrapper.

- [ ] **Step 1: Write the failing e2e test**

Add `test("shuffles impact digits on visit and settles for reduced motion", ...)` to `e2e/home.spec.ts`. It must:
  1. `goto("/")`; assert `.brutal-stats dd .sr-only` first has text `1,200+` and the visual `span[aria-hidden="true"]` first has text `1,200+`.
  2. Install a page-side `MutationObserver` on that visual span via `page.evaluate` that records every distinct `textContent` for 2s and resolves with the array, using `characterData`/`childList`/`subtree`.
  3. `scrollIntoViewIfNeeded()` on `.brutal-stats`, await the recorded array, assert at least one entry differs from `1,200+`, every entry has the same length and keeps `,` and `+` at their original indices, and finally `expect(visual).toHaveText("1,200+", { timeout: 2000 })`.
  4. In a second page (or after reload) call `page.emulateMedia({ reducedMotion: "reduce" })` before `goto("/")`, scroll to `.brutal-stats`, wait 600ms, and assert the visual text is still `1,200+`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "shuffles impact digits on visit"`
Expected: FAIL on missing `.sr-only` span / no mutations.

- [ ] **Step 3: Implement `StatNumber`**

In `src/components/public/stat-number.tsx`, write a `"use client"` component with signature `StatNumber({ value }: { value: string })`. Use `useRef<HTMLSpanElement>` on the visual span, `useState(value)`, and one `useEffect` that:
  - returns immediately when `window.matchMedia("(prefers-reduced-motion: reduce)").matches`;
  - creates an `IntersectionObserver` with `threshold: 0.5` on that visual span, disconnecting on first intersection;
  - starts an interval of 60ms for 8 ticks, setting `display` to `value.replace(/\d/g, () => String(Math.floor(Math.random() * 10)))` for ticks 1–7 and to `value` on tick 8, then clears the interval;
  - cleans up observer and interval on unmount.
Render the exact markup from Interfaces. Keep punctuation and digit count unchanged so `tabular-nums` prevents layout shift.

- [ ] **Step 4: Use it in the homepage**

In `src/app/(public)/page.tsx`, import `StatNumber` and replace each `<dd className="stat-value mt-3">{item.value}</dd>` with `<dd className="stat-value mt-3"><StatNumber value={item.value} /></dd>`. No other markup changes.

- [ ] **Step 5: Run the focused test to verify it passes**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "shuffles impact digits on visit"`
Expected: PASS, including the reduced-motion case.

- [ ] **Step 6: Update docs**

Append decision #64 to `docs/DECISIONS.md`: the shuffle is triggered on first scroll into view (so phones see it), uses `sr-only` final text with `aria-hidden` flicker, and is skipped under reduced motion.

- [ ] **Step 7: Run the full gate and commit**

Run the full gate from Global Constraints, then:
```bash
git add src/components/public/stat-number.tsx "src/app/(public)/page.tsx" e2e/home.spec.ts docs/DECISIONS.md
git commit -m "feat(ui): shuffle impact digits when they enter view"
```
