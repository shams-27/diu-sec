# Public Drawer & Minimal Footer — Short Design

**Status:** Approved

## Intent

Replace the public top navigation with a slide-out drawer that holds every public quick link, and reduce the footer to brand identity only. The partner chose a drawer over a permanent rail or icon rail, and asked for the footer quick-link columns to be removed.

## Goals

- Top bar keeps the DIU SEC brand, a `Menu` trigger, and `Join Now`; no inline nav links or mobile `<details>` dropdown.
- Drawer lists all 14 public routes, grouped as Explore and Service, and closes on link click, Escape, backdrop click, and its close button.
- Footer keeps the brand, department line, and copyright; removes all link columns.
- Native `<dialog>` only — no new dependency, no router wrapper, no custom overlay.
- Preserve WCAG AA, keyboard access, ≥360px layout, LCP/CLS, and the shared header/main/footer gutters.

## Non-goals

- Admin panel navigation.
- Removing or renaming public routes.
- Changing page content, colors, or typography.

## Approaches considered

- **Slide-out drawer (chosen):** clean top bar, full link access, works at all widths with one component.
- **Permanent left rail:** always visible but consumes content width and risks layout shift on the landing page.
- **Icon-only rail:** compact but poor discoverability and touch target clarity.

## Implementation decisions

- Add `src/components/public/site-nav-drawer.tsx` as a client component using `useRef` + native `dialog.showModal()`/`close()`.
- Move the public link groups out of `site-header.tsx` and `site-footer.tsx` into the drawer component; keep one source of truth for the links.
- Keep `SiteHeader` as a server component that renders `SiteNavDrawer` and the `Join Now` link.
- Style the drawer with existing Tailwind tokens and add only a `::backdrop` rule in `globals.css`; no entrance animation, so reduced motion stays trivially satisfied.
- Update `e2e/home.spec.ts`: open the drawer before clicking `Events` in the nav-transition test; add a drawer open/close/keyboard regression; keep the layout gutter assertions.
- Update `docs/DECISIONS.md` and `docs/design-system.md` to record the new navigation and footer shape.

## Verification

`pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e`, plus a browser check at 360px and 1280px and the existing Lighthouse command.
