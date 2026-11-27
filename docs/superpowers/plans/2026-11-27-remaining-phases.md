# Remaining Phases 3–9 — Execution Plan

Reference: `docs/superpowers/specs/2026-11-27-remaining-website-design.md`, README Sections 7–11, requirements files.
Each phase ends with `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, a browser smoke at 360px + desktop, README tick, then `feat(phase-N): ...` commit.

## Phase 3 — Committee & Wings (02, 03 + A-03, A-04)
- [x] Validators for sessions, committee members/reorder, wing edit/roster; tests.
- [x] `storage.ts` upload helper; portrait upload in committee form.
- [x] Public `/committee` (session filter) and `/wings`, `/wings/[slug]`.
- [x] Admin `/admin/committee` (sessions, CRUD, drag + keyboard reorder, archive) and `/admin/wings` (edit, lead, roster, syllabus), scoped actions with audit.
- [x] Seed leads/roster and extra committee members; verify + commit.

## Phase 4 — Events & Attendance (05 + A-05)
- [x] Add `qrcode` + `html5-qrcode`; validators for events/registration/check-in; tests.
- [x] Public `/events` (upcoming/past, live seat counter) and `/events/[slug]` (syllabus modal, registration, QR).
- [x] Transactional registration (atomic seat claim, no overbooking, unique email), audited.
- [x] Admin `/admin/events` CRUD/publish and `/admin/events/[id]/checkin` scanner + manual token, double check-in blocked; seed past event; verify + commit.

## Phase 5 — Certification (09 + A-06)
- [x] `certs.ts` PDF renderer (pdf-lib + embedded QR → `/verify/[certId]`); validators/tests.
- [x] Admin `/admin/certificates` bulk issue + revoke; audited, unique random IDs with collision retry.
- [x] Public `/verify` lookup and `/verify/[certId]` VALID / REVOKED / NOT FOUND + PDF download; verify + commit.

## Phase 6 — Content CMS (06, 07, 08, 10 + A-07–A-10)
- [x] Validators + tests for issues/articles, projects, hall of fame, notices.
- [x] Public `/magazine`, `/magazine/[issueId]`, `/hall-of-fame`, `/projects`, `/notices` with filters and empty states.
- [x] Admin CRUD/moderation pages with RBAC, GitHub URL verification, schedule/pin/expire; seed content; verify + commit.

## Phase 7 — Supporting modules (11–14 + A-11)
- [x] Validators + tests for resources, sponsors, gallery albums/photos, contact.
- [x] Public `/resources`, `/partners`, `/gallery` (lightbox), `/faq`, `/contact` (audited form).
- [x] Admin `/admin/resources`, `/admin/sponsors`, `/admin/gallery`; seed data; verify + commit.

## Phase 8 — Landing page & Dashboard (01 + A-01)
- [ ] Replace placeholder hero: mission, manifesto, 1,200+/25+/80+/150+ metrics, CTAs, live upcoming events/wings.
- [ ] Add `recharts`; real dashboard counts + wing distribution chart, wing-scoped for WING_LEAD; verify + commit.

## Phase 9 — Hardening
- [ ] In-memory rate limit + honeypot on `/join` and `/contact`; document limitation.
- [ ] `sitemap.ts`, `robots.ts`, OG image, metadata/a11y pass.
- [ ] `@playwright/test` config + e2e for join, registration + check-in, cert issue + verify, RBAC denial.
- [ ] `docs/deployment.md`; full gate + final browser smoke; commit.
