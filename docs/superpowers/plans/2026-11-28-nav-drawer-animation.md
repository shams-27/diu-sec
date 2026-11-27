# Quick-Links Drawer Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animate the public quick-links drawer with a CSS-only slide and backdrop fade, including exit, with reduced-motion support.

**Architecture:** Add transition rules to the existing `.nav-drawer` and `::backdrop` selectors in `src/app/globals.css`. Use `@starting-style` for entry and `allow-discrete` on `display`/`overlay` for exit, leaving the client component and native dialog semantics untouched. Pin the behaviour with e2e assertions that observe `transitionstart` events and reduced motion.

**Tech Stack:** Next 16 App Router, Tailwind 4, native `<dialog>`, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-28-nav-drawer-animation-design.md`

## Global Constraints

- No new dependencies, no client JS changes, no timers.
- Motion duration 200–350ms (design system); chosen value is 220ms `ease-out`.
- `prefers-reduced-motion: reduce` disables the motion completely.
- Keep native dialog semantics: focus trap, Escape, backdrop click and link dismissal unchanged.
- Do not animate the home hero or LCP text.
- Public UI only; admin pages are unchanged.

## Review Focus

- **Close/backdrop/Escape/link dismissal still work:** the existing drawer e2e covers all four and must stay green — Task 1 Step 1 keeps those assertions in place.
- **Exit actually animates rather than snapping shut:** Task 1 Step 1 asserts a second `transform` transition on close.
- **Backdrop fades with the panel:** Task 1 Step 1 asserts a `background-color` transition with `pseudoElement === "::backdrop"`.
- **Reduced-motion users see no motion:** Task 1 Step 1 asserts no `transitionstart` and an identity transform under `reducedMotion: "reduce"`.
- **Drawer still fills the viewport height with no horizontal overflow:** Task 1 Step 1 retains the existing geometry assertions.

---

### Task 1: Animate the drawer and pin it with e2e

**Files:**
- Modify: `e2e/home.spec.ts:24-54`
- Modify: `src/app/globals.css:267-286`
- Modify: `docs/design-system.md:45`
- Modify: `docs/DECISIONS.md`
- Commit here: `docs/superpowers/specs/2026-11-28-nav-drawer-animation-design.md`, `docs/superpowers/plans/2026-11-28-nav-drawer-animation.md`

**Interfaces:**
- Consumes: `<dialog className="nav-drawer ...">` from `src/frontend/shared/shell/site-nav-drawer.tsx`, with accessible name `Quick links`.
- Produces: CSS classes/selectors `.nav-drawer`, `.nav-drawer[open]`, `.nav-drawer::backdrop` and their reduced-motion opt-out; no new exported symbols.

- [ ] **Step 1: Write the failing e2e test**

In the existing `"keeps all quick links in an accessible drawer"` test, keep every current assertion. Before the first `Menu` click, register a transition recorder on the dialog:

```ts
await page.evaluate(() => {
  const w = window as Window & { drawerTransitions?: { property: string; pseudo: string }[] };
  w.drawerTransitions = [];
  document.querySelector("dialog.nav-drawer")!.addEventListener("transitionstart", (event) => {
    const transition = event as TransitionEvent;
    w.drawerTransitions!.push({ property: transition.propertyName, pseudo: transition.pseudoElement });
  });
});
```

After the first `Menu` click and the existing `toBeVisible()` assertion, assert:

```ts
expect(await page.evaluate(() => (window as Window & { drawerTransitions?: unknown[] }).drawerTransitions)).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ property: "transform" }),
    { property: "background-color", pseudo: "::backdrop" },
  ]),
);
await expect.poll(() => dialog.evaluate((el) => getComputedStyle(el).transform)).toBe("matrix(1, 0, 0, 1, 0, 0)");
```

Replace the direct `Close` click with a recorder reset plus click, and assert the close animation started:

```ts
await page.evaluate(() => {
  (window as Window & { drawerTransitions?: unknown[] }).drawerTransitions = [];
});
await dialog.getByRole("button", { name: "Close quick links" }).click();
expect(await page.evaluate(() => (window as Window & { drawerTransitions?: unknown[] }).drawerTransitions)).toEqual(
  expect.arrayContaining([expect.objectContaining({ property: "transform" })]),
);
await expect(dialog).toBeHidden();
```

After the Escape and link-dismissal assertions, add a reduced-motion check:

```ts
await page.emulateMedia({ reducedMotion: "reduce" });
await page.evaluate(() => {
  (window as Window & { drawerTransitions?: unknown[] }).drawerTransitions = [];
});
await page.getByRole("button", { name: "Menu" }).click();
await expect(dialog).toBeVisible();
expect(await page.evaluate(() => (window as Window & { drawerTransitions?: unknown[] }).drawerTransitions)).toEqual([]);
expect(await dialog.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0s");
await page.keyboard.press("Escape");
await expect(dialog).toBeHidden();
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "keeps all quick links in an accessible drawer"` (Playwright builds and starts its own server on port 3003).

Expected: FAIL — no `transform` transition is recorded and the reduced-motion duration is not `0s`.

- [ ] **Step 3: Implement the CSS**

In `src/app/globals.css`:

1. Give `.nav-drawer` a closed-state `transform: translateX(-100%)` and `.nav-drawer[open]` `transform: translateX(0)`.
2. Add `transition` on `.nav-drawer` for `transform 220ms ease-out`, `display 220ms allow-discrete` and `overlay 220ms allow-discrete`.
3. Add `@starting-style` with `.nav-drawer[open] { transform: translateX(-100%); }`.
4. Give `.nav-drawer::backdrop` a transparent starting background, keep the existing `.nav-drawer[open]::backdrop` scrim at `rgb(0 0 0 / 0.45)`, and add a `background-color 220ms ease-out` transition with `display`/`overlay` `allow-discrete` plus a matching `@starting-style` transparent entry.
5. Add `.nav-drawer, .nav-drawer::backdrop { transition: none; }` inside the existing `@media (prefers-reduced-motion: reduce)` block.

Do not change `site-nav-drawer.tsx` or any dialog state handling.

- [ ] **Step 4: Run the focused test and gates**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "keeps all quick links in an accessible drawer" && pnpm lint && pnpm typecheck`

Expected: all pass.

- [ ] **Step 5: Add documentation, run the full suite, and commit**

Update `docs/design-system.md` line 45 to note the 220ms slide and backdrop fade; append one row to `docs/DECISIONS.md` recording the CSS-only discrete-transition approach and reduced-motion opt-out.

Run: `set -a; . ./.env; set +a; pnpm e2e && pnpm test && git diff --check`

Expected: 17/17 e2e pass (including the CLS guard), 180/180 unit tests pass, no whitespace errors.

```bash
git add e2e/home.spec.ts src/app/globals.css docs/design-system.md docs/DECISIONS.md docs/superpowers/specs/2026-11-28-nav-drawer-animation-design.md docs/superpowers/plans/2026-11-28-nav-drawer-animation.md
git commit -m "feat(ui): animate the quick-links drawer"
```
