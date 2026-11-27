# DIU SEC — Remaining Website Design (Phases 3–9)

User request: “build the full website now … make it modern and designfull”. The README build order and requirements files already settle *what* to build, so there is no open product decision — the single sensible approach is to finish Phases 3–9 in order, verifying and committing each phase. This doc records the cross-phase choices so each phase stays consistent.

## Design direction

Follow `docs/design-system.md` exactly: Vibrant & Block-based, Bebas Neue headings, Source Sans 3 body, semantic tokens only, 4/8px rhythm, 200–300ms motion with `motion-reduce` opt-out, mobile first at 360px, visible focus rings, Lucide icons.

“Modern and designfull” is achieved without new UI dependencies:
- Heroes use a soft radial gradient + geometric block accents drawn with CSS only (`.hero-block`, `.page-hero`), never hard-coded colours outside `globals.css`.
- Content cards get a subtle lift/border transition on hover and focus-within.
- Badges are pill-shaped, dates/status use `font-mono` and `tabular-nums`.
- Section headings share one component; every page gets a hero/eyebrow, a real empty state, `loading.tsx`, and `error.tsx`.

## Shared engineering choices

- **Uploads**: `src/lib/storage.ts` writes validated images/PDFs into `public/uploads` and returns `/uploads/<random>.<ext>`; local dev and `next start` serve it directly. S3 can replace the helper later without touching callers. Size/MIME checks reuse `MAX_IMAGE_BYTES`, `MAX_PDF_BYTES`, `IMAGE_MIME` from `validators.ts`.
- **Mutating actions**: one file per module in `src/server/actions/`; order is authenticate → `can()` → Zod → write inside a serializable transaction → `writeAudit(..., tx)`. Public form actions (join/contact/registration) authenticate with `null` actor and audit with submitter email.
- **Validation**: every new schema and regex lives in `src/lib/validators.ts`; no component or action defines its own.
- **Wing scoping**: `requireActor(module, action, "own")` for list reads; every write re-checks `can(actor, module, action, resourceWingId)` inside the transaction using the DB row, never a form value.
- **Caching**: `await connection()` before any DB/auth read in App Router pages and route handlers (decision #18). `revalidatePath()` after mutations.
- **QR**: `qrcode` generates data URLs for event registration and certificate PDFs; `html5-qrcode` scans registration tokens in the admin check-in page.
- **Charts**: `recharts` only on the Phase 8 dashboard.
- **E2E**: `@playwright/test` for Phase 9; the MCP Playwright server cannot launch here (no Chrome distribution), so browser verification continues with the installed Chromium binary via a standalone script.

## Out of scope (per README)

No payments, email delivery, captcha vendor, custom login UI, AI features, or features beyond modules 01–14 / A-01–A-12. Rate limiting/honeypot are Phase 9 only.
