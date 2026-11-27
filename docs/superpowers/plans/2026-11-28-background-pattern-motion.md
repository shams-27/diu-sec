# Background Pattern Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public background grid visibly drift without JS, layout shift, or loss of reduced-motion support.

**Architecture:** Add one CSS keyframe to the existing `.pattern-surface` utility. It animates all four `background-position` layers together so the two 28px grid layers move one full tile diagonally in 8s while the radial glows stay fixed. Extend the existing homepage e2e test to pin the motion and the reduced-motion stop.

**Tech Stack:** CSS/Tailwind 4, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-28-background-pattern-motion-design.md`

## Global Constraints

- No new dependencies, no new DOM, no client JS.
- Public-only utility; `/admin` is untouched.
- The home hero stays static; no layout shift or CLS regression.
- `prefers-reduced-motion: reduce` disables all new motion.
- Keep the existing gradient colors, `28px 28px` grid size, and full-width `.pattern-surface` wrapper.

## Review Focus

- Reduced-motion users: `.pattern-surface` animation must become `none` after `emulateMedia({ reducedMotion: "reduce" })` and reload. Test: Task 1, Step 1.
- Hero LCP: `.hero-surface` animation name stays `none`. Test: Task 1, Step 1.
- Seamless loop: grid moves exactly one 28px tile in 8s, so the repeat has no jump. Test: exact keyframe values pinned in Task 2, Step 3.
- No CLS: pattern width still equals viewport width. Test: existing `expectFullWidthLayout()` in the same e2e test.
- Admin unaffected: no admin component uses `.pattern-surface`. Test: grep verification in Task 2, Step 4.

---

### Task 1: Pin pattern motion and reduced-motion behavior in e2e

**Files:**
- Modify: `e2e/home.spec.ts` — test starting at line 200 (`staggers cards, fills the viewport with pattern...`)

**Interfaces:**
- Consumes: existing `.pattern-surface` and `.hero-surface` elements on `/`.
- Produces: e2e assertions that fail until Task 2 lands.

- [ ] **Step 1: Write the failing test**

Inside the existing test, after the current gradient assertions, add:

```ts
const patternAnimation = await page.locator(".pattern-surface").evaluate((el) => {
  const styles = getComputedStyle(el);
  return { name: styles.animationName, duration: styles.animationDuration };
});
expect(patternAnimation).toEqual({ name: "pattern-drift", duration: "8s" });
expect(
  await page.locator(".hero-surface").first().evaluate((el) => getComputedStyle(el).animationName),
).toBe("none");
```

After the existing `await page.emulateMedia({ reducedMotion: "reduce" }); await page.reload(...)`, add:

```ts
expect(await page.locator(".pattern-surface").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "staggers cards"`
Expected: FAIL because `.pattern-surface` has no animation yet.

- [ ] **Step 3: Implement the CSS**

In `src/app/globals.css`:

```css
@keyframes pattern-drift {
  from { background-position: 0 0, 0 0, 0 0, 0 0; }
  to { background-position: 0 0, 0 0, 28px 28px, 28px 28px; }
}
```

Add `animation: pattern-drift 8s linear infinite;` to `.pattern-surface` after its `background-size` declaration. Add `.pattern-surface { animation: none; }` inside the existing `@media (prefers-reduced-motion: reduce)` block.

- [ ] **Step 4: Run the test and full gates to verify they pass**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "staggers cards" && pnpm lint && pnpm typecheck && pnpm test`
Expected: all pass; `patternAnimation` is `{ name: "pattern-drift", duration: "8s" }`, reduced-motion name is `none`.

- [ ] **Step 5: Log the decision and commit**

Add a new row to `docs/DECISIONS.md` recording the visible 8s grid drift and reduced-motion override.

```bash
git add e2e/home.spec.ts src/app/globals.css docs/DECISIONS.md
git commit -m "feat(ui): drift the public background pattern"
```
