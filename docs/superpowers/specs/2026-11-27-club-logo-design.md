# Club Logo in Public Shell Design

**Status:** Proposed

## Intent

Use the club’s supplied `sec_logo.png` as the brand mark on public pages instead of the “DIU SEC” text label, so the site shows the real identity everywhere visitors see the shell.

## Scope

- Public header and public footer only.
- Admin sidebar, ID-card canvas text, copyright line, and all server behavior are unchanged.

## Goals

- Header logo replaces the decorative rotated square plus “DIU SEC” text inside the existing home link.
- Footer logo replaces the “DIU SEC” heading; the “Software Engineering Club” description and copyright line stay.
- Logo is visible, correctly sized, and accessible at 360px and desktop, in light and dark themes.

## Non-goals / anti-goals

- No new icon or redrawn logo, no restyling of the admin panel, no change to generated member cards.
- No new dependency and no new animation.

## Constraints

- The source file at `images/sec_logo.png` is user-supplied and stays untouched; Next only serves assets from `public/`, so it is copied to `public/sec_logo.png`.
- The PNG is 82×40 RGBA with transparent background and blue artwork; its blue has only ~2.3:1 contrast on the dark header, so dark mode puts it on a small white chip to clear the 3:1 non-text minimum.
- Use fixed `width`/`height` so there is no layout shift; follow the repo’s existing plain-`<img>` pattern rather than adding `next/image`.
- Alt text gives the home link an accessible name; existing focus rings and header/footer layout must remain intact.

## Approaches

1. Header only — smallest diff, but footer branding stays inconsistent. Rejected by the partner.
2. **Header + footer (chosen).** Both public shell surfaces show the logo; the footer description and copyright stay as text.
3. Header + footer + admin sidebar — full replacement, but the partner scoped the request to the website, not the admin panel.

## Implementation

- Copy the PNG into `public/sec_logo.png` without modifying `images/sec_logo.png`.
- In `src/components/public/site-header.tsx`, replace the rotated square and text inside the home `Link` with the image (`alt="DIU SEC"`, intrinsic 82×40, ~40px tall display).
- In `src/components/public/site-footer.tsx`, replace only the “DIU SEC” heading with the image at the same display height.
- Add a light background behind the image in dark mode for contrast.
- Add e2e assertions: logo visible in header and footer with correct `alt`/source and intrinsic dimensions, no leftover brand text label, no overflow at 360px, and dark-mode chip contrast; keep the CLS test green.
- Update `docs/design-system.md` and `docs/DECISIONS.md` with the logo usage and dark-mode chip decision.

## What is left to the builder

Exact display height (40px vs slightly larger) and chip padding are to be settled by measured 360px/desktop checks; do not upscale the 82×40 source materially.
