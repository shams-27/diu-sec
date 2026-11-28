# Admin Public Style Alignment Implementation Plan (superseded by 2026-11-28-admin-brutalist.md; decision #86)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every `/admin/*` screen share the public site's blue palette, typography and restrained texture without changing behavior or adding dependencies.

**Architecture:** One `admin-surface` class on the admin shell plus one unlayered CSS block in `src/app/globals.css` normalises existing Tailwind utilities on all admin screens (unlayered wins over Tailwind's utility layer, as `.public-brutal` already does). No feature files, server actions or auth paths change.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS 4, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-28-admin-public-style-design.md`

## Global Constraints

- Keep the blue semantic tokens from `docs/design-system.md`; no hard-coded hex in components.
- Do not add dependencies; do not modify public pages or `.public-brutal`.
- No hard offset shadows, 2px all-over ink rules or square-everything in admin; dense tables stay flat and readable.
- Mobile-first ≥360px, visible focus rings, WCAG AA contrast, `prefers-reduced-motion` respected.
- No changes to RBAC, server actions, data queries or audit logging.
- After each task: `pnpm lint && pnpm typecheck && pnpm test`. Commit with a concise message.

## Review Focus

- **360px viewport:** admin header, sidebar disclosure and tables must not cause horizontal page overflow → e2e asserts `scrollWidth <= innerWidth` at 360px in Task 2.
- **Keyboard focus:** scoped control styling must not remove focus rings → e2e keyboard-focuses a button and checks its ring shadow in Task 2.
- **Reduced motion:** admin must keep the project's reduced-motion opt-out → unit test asserts the media query remains in Task 1.
- **Dark mode / contrast:** tinted primary surfaces must still use semantic tokens, not fixed colours → unit test asserts token usage and no hex literals in the admin block in Task 1.
- **Wing Lead read-only pages:** same styling on allowed and denied admin screens, with no data exposure → e2e loads `/admin/members` with a super-admin cookie; existing `e2e/rbac.spec.ts` still passes unchanged in Task 2.

---

### Task 1: Scoped admin style layer

**Files:**
- Modify: `src/app/admin/layout.tsx:17` (add the wrapper class to the outer shell div)
- Modify: `src/app/globals.css` (append unlayered `.admin-surface` rules after the `.public-brutal` block)
- Test: `tests/admin-style.test.ts`

**Interfaces:**
- Consumes: existing CSS tokens `--primary`, `--secondary`, `--card`, `--muted`, `--border`, `--foreground`, `--muted-foreground`, existing classes `.pill`, `.card-lift`, `.eyebrow`, `.section-title`.
- Produces: `.admin-surface`, applied by the admin layout; all later admin styling relies on this class.

- [ ] **Step 1: Write the failing test**

`tests/admin-style.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
const layout = readFileSync("src/app/admin/layout.tsx", "utf8");

describe("admin style layer", () => {
  it("wraps admin routes in the scoped surface", () => {
    expect(layout).toContain("admin-surface");
  });

  it("normalises admin type, controls and tables with the shared tokens", () => {
    for (const selector of [
      ".admin-surface :is(h1, h2, h3)",
      ".admin-surface :is(button, a[class*=\"bg-primary\"])",
      ".admin-surface :is(input, select, textarea)",
      ".admin-surface th",
      ".admin-surface .pill",
    ]) {
      expect(css).toContain(selector);
    }
    expect(css).toContain("var(--primary)");
    expect(css).not.toMatch(/\.admin-surface[^}]*#[0-9a-f]{3,8}/i);
  });

  it("avoids the public hard shadow and keeps reduced motion", () => {
    expect(css).not.toMatch(/\.admin-surface[^}]*box-shadow:\s*[68]px/);
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/admin-style.test.ts`
Expected: FAIL — `admin-surface` not found in layout or CSS.

- [ ] **Step 3: Wrap the admin shell**

In `src/app/admin/layout.tsx`, add `admin-surface` to the outermost `<div className="flex min-h-screen flex-col lg:flex-row">` so all admin pages inherit the scope.

- [ ] **Step 4: Add the unlayered CSS block**

Append to `src/app/globals.css` after the `.public-brutal` rules:

- `.admin-surface :is(h1, h2, h3)` — use `var(--font-bebas)`, uppercase-like tracking, token foreground; h1 larger than h2.
- `.admin-surface :is(button, a[class*="bg-primary"])` — small consistent radius (4px), token background/border/text, 200ms transition, keep existing focus ring utilities.
- `.admin-surface :is(input, select, textarea)` — same radius and `var(--border)` border, `var(--background)` field background.
- `.admin-surface :is(section, form, [class*="rounded-2xl"], [class*="rounded-xl"])` — calm 8px radius only; no hard offset shadow.
- `.admin-surface th` — mono uppercase small label, tinted `var(--muted)` background via `color-mix`.
- `.admin-surface .pill` — mono uppercase tracking like public `.eyebrow`, token border.
- `.admin-surface .admin-banner` and `.admin-surface .hero-surface` — keep the existing soft radial glow but reduce the dot-grid strength so the hierarchy reads calmer than public brutalism.
- No new media queries other than relying on the existing global reduced-motion block.

Use only `var(--…)` colours; do not add a new `box-shadow` with a hard offset.

- [ ] **Step 5: Run the test and full checks**

Run: `pnpm test tests/admin-style.test.ts && pnpm lint && pnpm typecheck && pnpm test`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/layout.tsx src/app/globals.css tests/admin-style.test.ts
git commit -m "style(admin): share the public design language"
```

### Task 2: Browser verification and documentation

**Files:**
- Create: `e2e/admin-style.spec.ts`
- Modify: `docs/design-system.md` (admin section)
- Modify: `docs/DECISIONS.md` (new bottom row, next number after 84)
- Modify: `.gitignore` (`/.superpowers/` ignore added during brainstorming; include it here)

**Interfaces:**
- Consumes: `superAdminCookie()` from `e2e/helpers.ts`; `admin-surface` from Task 1.
- Produces: no code interface; documentation of the chosen style and its verification.

- [ ] **Step 1: Write the e2e test**

`e2e/admin-style.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { superAdminCookie } from "./helpers";

test("admin style matches public typography without breaking small screens", async ({ page }) => {
  const cookie = await superAdminCookie();
  await page.context().addCookies([{ name: "authjs.session-token", value: cookie, domain: "localhost", path: "/" }]);

  for (const viewport of [{ width: 360, height: 780 }, { width: 1280, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
    const font = await page.locator("h1").first().evaluate((el) => getComputedStyle(el).fontFamily);
    expect(font).toContain("Bebas Neue");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  await page.goto("/admin/members");
  const thFont = await page.locator("thead th").first().evaluate((el) => getComputedStyle(el).fontFamily);
  expect(thFont).toContain("Geist Mono");

  const button = page.getByRole("link", { name: "Export CSV" });
  await button.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  expect(await button.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe("none");
});
```

- [ ] **Step 2: Run e2e and verify it passes**

Run: `pnpm e2e e2e/admin-style.spec.ts`
Expected: PASS at both viewports; no horizontal overflow; focus outline visible.

- [ ] **Step 3: Update the design-system doc**

In `docs/design-system.md`, replace the "Admin shell & dashboard (A-01)" section with the shared admin style: scoped `.admin-surface`, public type/mono labels and tokens, calm 8px surfaces, flat tables, no brutalist shadow, focus/reduced-motion rules.

- [ ] **Step 4: Log the decision**

Append a row to `docs/DECISIONS.md`: the admin panel adopts the public visual language with calmer surfaces for dense screens; the full `.public-brutal` treatment was rejected for admin; no new dependency.

- [ ] **Step 5: Run full checks**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e`
Expected: all PASS, including existing `e2e/rbac.spec.ts`.

- [ ] **Step 6: Commit**

```bash
git add e2e/admin-style.spec.ts docs/design-system.md docs/DECISIONS.md .gitignore
git commit -m "docs(admin): record the shared public style"
```
