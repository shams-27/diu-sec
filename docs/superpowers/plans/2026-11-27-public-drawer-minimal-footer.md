# Public Drawer & Minimal Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace public inline navigation with a native-dialog side drawer holding all quick links, keep only brand/Menu/Join Now in the top bar, and reduce the footer to brand identity.

**Architecture:** `SiteHeader` stays a server component and composes a new client `SiteNavDrawer` that owns a native `<dialog>`, its open state, and the single source of truth for public links. `SiteFooter` drops its link columns. No new dependency or animation is added; existing Tailwind tokens and e2e cover behavior.

**Tech Stack:** Next.js 16.4.6 App Router, React 19.3, native `<dialog>`, Tailwind 4, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-27-public-drawer-minimal-footer-design.md`

## Global Constraints

- Work on `main`; do not stage or restore the local `D .env.example`.
- No new dependency, no custom overlay library, no router wrapper.
- Top bar keeps the brand, a `Menu` trigger, and a `Join Now` link; no inline nav or mobile `<details>` menu.
- Drawer must contain all 14 public routes from the current footer groups.
- Native `<dialog>` only; Escape and a close button must dismiss it, and choosing a link must close it.
- Footer keeps brand, department line, and copyright only; no navigation columns.
- Mobile-first ≥360px, keyboard accessible, WCAG AA, no horizontal overflow.
- Home hero/LCP stays static; no entrance animation, so reduced motion needs no new rule.
- Keep shared `px-6 sm:px-10 lg:px-16` gutters on header inner div, `<main>`, and footer inner div.
- Gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e`.

## Review Focus

- **360px top bar:** brand, `Menu`, and `Join Now` must fit without overflow; e2e asserts no horizontal overflow at 360px after the header changes.
- **Keyboard/modal behavior:** Escape and the close button must dismiss the drawer; e2e presses Escape and clicks `Close quick links`.
- **Complete link set:** all 14 public routes must remain reachable; e2e asserts `Committee` and `Contact` endpoints in the drawer and counts 14 links.
- **Route change:** clicking `Events` inside the drawer must navigate and close it; e2e asserts URL and dialog hidden.
- **Existing nav transition:** opening the dialog must not break `ViewTransition`; e2e still polls for `page-fade-in` after clicking `Events` in the drawer.

---

### Task 1: Side drawer, top bar, and minimal footer

**Files:**
- Create: `src/components/public/site-nav-drawer.tsx`
- Modify: `src/components/public/site-header.tsx`
- Modify: `src/components/public/site-footer.tsx`
- Modify: `src/app/globals.css`
- Modify: `e2e/home.spec.ts`
- Modify: `docs/DECISIONS.md`
- Modify: `docs/design-system.md`
- Modify: `docs/superpowers/specs/2026-11-27-public-drawer-minimal-footer-design.md`

**Interfaces:**
- Consumes: `next/link`, React `useRef`/`useState`, existing `link-underline` utility.
- Produces: `SiteNavDrawer` with no props, rendered inside the header.
- Produces: header menu button named `Menu`, dialog named `Quick links`, close button named `Close quick links`, and top-bar link named `Join Now`.

- [ ] **Step 1: Write failing e2e regressions**

In `e2e/home.spec.ts`, add:

```ts
test("keeps all quick links in an accessible drawer", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
  await expect(page.locator("header").getByRole("link", { name: "Join Now" })).toBeVisible();

  await page.getByRole("button", { name: "Menu" }).click();
  const dialog = page.getByRole("dialog", { name: "Quick links" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link")).toHaveCount(14);
  await expect(dialog.getByRole("link", { name: "Committee" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Contact" })).toBeVisible();
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
```

In the existing `"staggers cards, fills the viewport with pattern, scales type and disables motion"` test, keep the 360px no-overflow assertion (already present). In the existing `"runs a page transition when a header nav link is clicked"` test, rename it to `"runs a page transition when a drawer link is clicked"` and replace the inline nav click with:

```ts
await page.getByRole("button", { name: "Menu" }).click();
await page
  .getByRole("dialog", { name: "Quick links" })
  .getByRole("link", { name: "Events" })
  .click();
```

- [ ] **Step 2: Run the failing tests**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "drawer|page transition"`

Expected: FAIL because no `Menu` button, no `Quick links` dialog, and the old `Main navigation` still exists.

- [ ] **Step 3: Create the drawer component**

Create `src/components/public/site-nav-drawer.tsx` as a client component. It must:

- Export `SiteNavDrawer` with no props.
- Define `PUBLIC_NAV_GROUPS` with the 14 current public routes in two groups: `Explore` (Committee, Wings, Membership `/join`, Events, Magazine, Hall of Fame, Projects) and `Service` (Verify Certificate, Notices, Resources, Partners, Gallery, FAQ, Contact).
- Render a `button type="button"` named `Menu` with `aria-haspopup="dialog"` and `aria-expanded` reflecting open state, calling `dialogRef.current?.showModal()`.
- Render a native `<dialog ref={dialogRef} aria-label="Quick links" className="nav-drawer ...">` with a close `button` named `Close quick links` calling `close()`, and a `<nav aria-label="Quick links">` listing every link.
- Close the dialog on backdrop click (`event.target === event.currentTarget`), on each link click, and in `onClose` so `aria-expanded` resets.
- Use existing `link-underline` styling for links. Put positioning, full height, card background, border, and shadow on the `<dialog>`; put padding on an inner wrapper so backdrop clicks do not hit dialog padding.

- [ ] **Step 4: Wire the header and footer**

In `src/components/public/site-header.tsx`, remove `LINKS`, the desktop `<nav>`, and the mobile `<details>`. Keep the existing outer `<header>` and inner flex `<div>` (the gutter selector depends on them), render the brand link, `<SiteNavDrawer />`, and a `Join Now` link to `/join` using the existing primary-button classes.

In `src/components/public/site-footer.tsx`, remove `GROUPS` and all `<nav>` columns. Keep the outer `<footer>`, the first inner `<div>` with the same `max-w-6xl` and gutter classes, the brand/department text, and the copyright row.

- [ ] **Step 5: Add the backdrop style and update docs**

In `src/app/globals.css`, add only:

```css
.nav-drawer::backdrop {
  background: rgb(0 0 0 / 0.45);
}
```

Update `docs/DECISIONS.md` with a new row: public navigation moved to a native `<dialog>` drawer with all 14 routes, top bar reduced to brand/Menu/Join Now, footer reduced to brand identity. Update `docs/design-system.md` navigation/footer lines to match. Keep the spec status `Approved`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `set -a; . ./.env; set +a; pnpm e2e --grep "drawer|page transition"`

Expected: PASS, including no overflow at 360px, dialog dismissal, and `page-fade-in` after clicking `Events` in the drawer.

- [ ] **Step 7: Full gate and commit**

```bash
set -a; . ./.env; set +a
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e
git add src/components/public/site-nav-drawer.tsx src/components/public/site-header.tsx src/components/public/site-footer.tsx src/app/globals.css e2e/home.spec.ts docs/DECISIONS.md docs/design-system.md docs/superpowers/specs/2026-11-27-public-drawer-minimal-footer-design.md
git commit -m "feat(ui): move public links into a side drawer"
```

Expected: lint/typecheck clean, 151 unit tests pass, build succeeds, all e2e tests pass.

## Final Verification

- Browser check at 360px and 1280px: drawer opens/closes, all links visible, no header overflow, footer has no link columns.
- Lighthouse with the project's v13 command must keep LCP < 1s, CLS 0, and accessibility 100.
