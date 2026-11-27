# Admin UI Visual Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the admin shell and dashboard visibly branded with the existing design system (pattern, type scale, motion) without changing any module behaviour.

**Architecture:** Reuse the tokens and component utilities already in `globals.css` (`hero-surface`, `dot-grid`, `card-lift`, `pill`, `stat-value`). Add only two small CSS utilities for the branded banner and staggered entrance animation, then compose them in the admin layout, sidebar and dashboard. All patterns are decorative CSS backgrounds; accessibility, auth and data flow stay untouched.

**Tech Stack:** Next.js App Router, Tailwind v4, shadcn/ui, existing Bebas Neue / Source Sans 3 fonts.

**Spec:** `docs/design-system.md`, `AGENTS.md` hard rules 8–9.

## Global Constraints

- Mobile-first (≥360px), keyboard accessible, `prefers-reduced-motion` honoured.
- Semantic tokens only; no new hex values in components and no new dependencies.
- No changes to auth, RBAC, server actions, validators or data queries.
- Scope is the admin shell + A-01 dashboard; other admin modules inherit shell styling only.

## Review Focus

- Reduced-motion users must see static, fully visible content — verify computed `animation-name` is `none` in an emulated reduced-motion context.
- Decorative patterns must not reduce text contrast or become focusable — verify screenshots and DOM focus order.
- 360px layout must not overflow — verify sidebar disclosure and banner/card grids at 360px.
- Hover lift must still work after entrance animations — use an animation fill mode that does not pin `transform`.
- Focus rings must remain visible on the header link and sidebar links.

---

### Task 1: Admin shell and sidebar treatment

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/components/admin/admin-sidebar.tsx`

- [ ] **Step 1: Add `.admin-banner` and `.admin-enter` utilities to `globals.css`**, with a token-based dotted/gradient background and a 350ms fade-up keyframe disabled under `prefers-reduced-motion`.

- [ ] **Step 2: Compose the header** in `src/app/admin/layout.tsx`: patterned banner, brand mark, "Administration" label, role pill from `session.user.role`, and the existing "View site" link with a visible focus ring.

- [ ] **Step 3: Style the sidebar** in `src/components/admin/admin-sidebar.tsx`: branded title block, active link accent bar, and colour/hover transitions that disappear under reduced motion.

- [ ] **Step 4: Verify** at 1440px and 360px with a seeded admin cookie, including a reduced-motion context and keyboard focus on header/sidebar links.

### Task 2: Dashboard composition

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Restyle the A-01 header** as a patterned banner using `admin-banner`, `admin-enter`, a `pill` eyebrow and larger Bebas display type.

- [ ] **Step 2: Apply `card-lift admin-enter` with staggered `animationDelay` to metric cards** and use the existing `stat-value` class for numbers; keep the four-card grid and all card data unchanged.

- [ ] **Step 3: Apply the same treatment to the chart section** with `hero-surface` and a delayed entrance, keeping the chart accessible and unobstructed.

- [ ] **Step 4: Verify** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` and compare screenshots at 1440px/360px.

### Task 3: Document and final gate

**Files:**
- Modify: `docs/design-system.md`
- Modify: `docs/DECISIONS.md`

- [ ] **Step 1: Append the admin shell/dashboard treatment** to the design system and log the scope decision in `docs/DECISIONS.md`.

- [ ] **Step 2: Run the full gate and e2e suite**, then commit `feat(admin-ui): add branded patterns, typography and motion`.
