# SEC favicon — design

## Intent

The human partner wants the browser tab to show the existing DIU SEC logo instead of the scaffold Next.js icon.

## Goals

- Replace `src/app/favicon.ico` with a square, transparent icon derived from `public/sec_logo.png`.
- Keep the source logo unchanged and add no dependency.

## Non-goals

- No page layout, metadata, RBAC, audit, or behavior changes.
- No apple-touch or PWA icon set; the request is specifically the browser tab.

## Approaches

1. **Replace `src/app/favicon.ico` with a logo-based multi-size ICO (chosen)** — Next already auto-wires `app/favicon.ico` into `<head>`, so no code change is needed; browsers get a correctly squared 16/32/48px icon.
2. Point `metadata.icons` at `/sec_logo.png` — smallest diff, but the 82×40 wide asset is cropped or letterboxed inconsistently across browsers.
3. Add `app/icon.png` — Next emits sized tags, but the old `favicon.ico` remains and can still be requested; two icon sources add ambiguity.

## Constraints

- Use Pillow, already available locally, to pad the transparent 82×40 logo into a square canvas and write ICO frames.
- Keep the generated binary small and deterministic; do not edit `public/sec_logo.png`.

## Verification

- A failing e2e assertion first checks `<link rel="icon">` and that the icon URL responds with an image.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e` must pass.
- Append a decision row; leave all work uncommitted for the partner to commit.
