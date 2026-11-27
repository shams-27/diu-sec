# DIU SEC — Website & Admin Panel

Official platform for the **Software Engineering Club (DIU SEC)**, Daffodil International University (Dept. of Software Engineering, code `35`).

Two apps in one repo:

- **Public Website** — 14 modules (club intro, committee, wings, membership, events, magazine, hall of fame, projects, certificate verification, notices, resources, partners, gallery, FAQ/contact).
- **Admin Panel** — 12 modules (A-01 to A-12) to manage everything above, with RBAC, SSO and immutable audit logs.

> **For OpenCode / AI agents:** read this whole file first, then follow [Build Order](#build-order) one phase at a time. This README is the source of truth. Do not invent features outside it. If something is ambiguous, pick the simplest option, record it in `docs/DECISIONS.md`, and continue.

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router), TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Auth.js (NextAuth) — Google OAuth, restricted to `@diu.edu.bd` |
| Validation | Zod (shared between client and server) |
| Forms | React Hook Form + `@hookform/resolvers/zod` |
| PDFs | `pdf-lib` (certificates), `@react-pdf/renderer` optional (ID cards) |
| QR | `qrcode` (generate), `html5-qrcode` (scan) |
| Charts | Recharts |
| Storage | S3-compatible (Cloudflare R2 / Supabase Storage); local `./uploads` in dev |
| Tests | Vitest (unit), Playwright (e2e) |
| Package manager | pnpm |

Stack is a default. If you change it, update this table and `docs/DECISIONS.md`.

---

## 1b. OpenCode Plugins, Skills & MCP

Configured in `opencode.json` and `.opencode/skills/`:

- **superpowers** plugin (`obra/superpowers`): brainstorm, plan, TDD, debugging and verification skills.
- **ponytail** plugin (`@dietrichgebert/ponytail`): minimal-code discipline; `/ponytail`, `/ponytail-review`, `/ponytail-audit`.
- **UI/UX Pro Max** skill + `design-system`, `ui-styling`, `brand` skills: design system generation for every UI phase.
- **context7** MCP (live library docs) and **playwright** MCP (browser verification).

Requirements: Node 20+, Python 3 (UI/UX Pro Max search script), git. Restart OpenCode after cloning so plugins install.
Targets **OpenCode 2**: ponytail uses the `plugins` key; superpowers is listed under `plugin` (its documented key). If superpowers does not load (ask "Tell me about your superpowers"), move it into `plugins`.

---

## 2. Repository Structure

```
diu-sec/
├── README.md
├── AGENTS.md                 # copy of Section 12 (agent rules) for OpenCode
├── docs/
│   ├── DECISIONS.md          # log of every assumption/decision
│   ├── requirements/         # website.md, admin-panel.md (source of truth)
│   └── archive/              # original PDFs (humans only)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/                  # routing shell: thin page.tsx files with metadata + re-export
│   │   ├── (public)/
│   │   ├── admin/
│   │   └── api/
│   ├── frontend/
│   │   ├── shared/           # ui/, shell/, form/, utils.ts, page-hero.tsx
│   │   └── features/         # one folder per domain: page bodies + components
│   │       └── <domain>/     # e.g. membership/, events/, certificates/
│   └── backend/
│       ├── shared/           # db, auth, rbac, audit, validators, storage, …
│       └── features/         # one folder per domain
│           └── <domain>/     # actions, queries.ts, generators
├── tests/
└── .env.example
```

Each feature lives in one folder per layer: UI in `src/frontend/features/<domain>/`, data and mutations in `src/backend/features/<domain>/`. A route `page.tsx` only holds its `metadata` export and re-exports the feature's page body as default. Frontend files never import Prisma; backend files never import frontend. Adding a feature means adding one folder in each layer plus a thin route.

---

## 3. Getting Started

```bash
git clone <repo-url> diu-sec && cd diu-sec
pnpm install
cp .env.example .env            # fill values (Section 4)
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev                        # http://localhost:3000
```

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest |
| `pnpm e2e` | Playwright |
| `pnpm prisma studio` | DB browser |

---

## 4. Environment Variables (`.env.example`)

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/diusec"

AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
ALLOWED_EMAIL_DOMAIN="diu.edu.bd"

NEXT_PUBLIC_SITE_URL="http://localhost:3000"

STORAGE_DRIVER="local"          # local | s3
S3_ENDPOINT=""
S3_BUCKET=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""

SUPER_ADMIN_EMAIL=""            # seeded as President / Super Admin
BOOTSTRAP_ONLY="false"          # true: production seed creates only the admin and wings
```

Never commit `.env`.

---

## 5. Validation Rules (shared constants in `src/backend/shared/validators.ts`)

| Field | Rule |
|---|---|
| DIU SWE Student ID | Format `XXX-35-XXX`: `^\d{3}-35-\d{3,4}$` (the middle `35` is the SWE department code). Keep the regex in one constant so it is easy to adjust. |
| Institutional email | Must end with `@diu.edu.bd` (case-insensitive) |
| Certificate ID | `DIU-SEC-CERT-XXXX` → `^DIU-SEC-CERT-[0-9A-Z]{4,}$`, unique, non-sequential-guessable (random suffix) |
| Member ID card number | Generated, unique, e.g. `SEC-<year>-<seq>` |
| GitHub URL | Must match `https://github.com/<owner>/<repo>` |
| Uploads | Images ≤ 5 MB (jpg/png/webp); PDFs ≤ 25 MB |

---

## 6. Data Model (Prisma — implement in `schema.prisma`)

Core entities and key fields. Add `createdAt`, `updatedAt` to all.

- **User** — id, email (`@diu.edu.bd`), name, role (`SUPER_ADMIN | GENERAL_SECRETARY | WING_LEAD | PUBLICATION_EDITOR`), wingId?
- **Member** — studentId (unique), name, email (unique), batch, phone?, wingPreference, status (`PENDING | APPROVED | REJECTED | REVOKED`), memberCardNo?, cardIssuedAt?
- **Session** — year (unique), label, isCurrent, archived
- **CommitteeMember** — sessionId, name, title, batch, photoUrl, socialLinks (JSON), order
- **Wing** — slug, name, description, responsibilities, syllabusUrl?, leadId?
- **WingMember** — wingId, memberId, role (`LEAD | CORE | MEMBER`)
- **Event** — type (`HACKATHON | WORKSHOP | COURSE`), title, slug, description, syllabus (JSON), startsAt, endsAt, capacity, status (`DRAFT | PUBLISHED | ARCHIVED`)
- **Registration** — eventId, memberId?/name/email, status, qrToken (unique), checkedInAt?
- **Certificate** — certId (unique), recipientName, type (`PARTICIPANT | WINNER | EXECUTIVE | COURSE`), eventId?, issuedAt, status (`VALID | REVOKED`), pdfUrl
- **MagazineIssue** — number, title, pdfUrl, coverUrl, featured, publishedAt
- **Article** — title, body, authorId/name, status (`SUBMITTED | APPROVED | REJECTED`), issueId?
- **Project** — title, description, githubUrl, demoUrl?, techStack[], contributors[], tags[], status (`SUBMITTED | APPROVED | REJECTED`), featured
- **HallOfFameEntry** — category (`ICPC | NCPC | HACKATHON | GSOC | ALUMNI`), title, personName, year, description, imageUrl?, verified
- **Notice** — title, body, pinned, publishAt, expireAt?, category (`RECRUITMENT | COMMITTEE | CONTEST | CAMPUS | URGENT`)
- **Resource** — type (`CP_SHEET | ROADMAP | GITHUB_REPO | INTERVIEW_GUIDE`), title, url, tags[]
- **Sponsor** — name, logoUrl, tier, websiteUrl, kind (`PARTNER | SPONSOR | FACULTY_ADVISOR`), bio?
- **GalleryAlbum / GalleryPhoto** — album category (`ORIENTATION | CONTEST | TECH_FEST | OTHER`)
- **Faq** — question, answer, order
- **ContactMessage** — name, email, message, status
- **AuditLog** — actorId, action (`CREATE | UPDATE | DELETE | APPROVE | REVOKE ...`), entity, entityId, before (JSON), after (JSON), ip, createdAt. **Append-only** (no update/delete endpoints; add a DB-level rule or trigger that blocks UPDATE/DELETE).

---

## 7. Public Website Modules

| ID | Module | Route | Must have |
|---|---|---|---|
| 01 | Intro | `/` | Mission, manifesto, impact metrics (**1,200+ members, 25+ hackathons, 80+ workshops, 150+ projects**), CTAs (Join, Events, Verify Certificate) |
| 02 | Committee | `/committee` | Filter by session/year (2026, 2025…), cards with role, batch, social links |
| 03 | Wings | `/wings`, `/wings/[slug]` | 5 wings: Competitive Programming, Web & Mobile Dev, AI/ML, Cyber Security & DevOps, UI/UX. Show Wing Leads, Core Members, responsibilities |
| 04 | Membership Apply | `/join` | Form validating ID `XXX-35-XXX` + `@diu.edu.bd` email; **instant Digital Member ID Card** (downloadable PNG/PDF) on submission |
| 05 | Events & Courses | `/events`, `/events/[slug]` | Upcoming/past tabs, syllabus modal, **live seat counter**, seat reservation |
| 06 | Magazine | `/magazine` | Issue list, article reading, downloadable PDF issues |
| 07 | Hall of Fame | `/hall-of-fame` | ICPC/NCPC finalists, hackathon champions, GSoC, alumni; category filter |
| 08 | Projects | `/projects` | Filter by tag/tech stack, live demo + GitHub links, contributors |
| 09 | Certificate Verification | `/verify`, `/verify/[certId]` | Lookup by ID, QR landing page, valid/revoked state, download PDF |
| 10 | Notices | `/notices` | Pinned first, hide expired, category filter |
| 11 | Resources | `/resources` | CP sheets, GitHub repos, interview guides, fresher roadmaps |
| 12 | Partners & Sponsors | `/partners` | Industry partners, sponsors, faculty advisors (Dept. of SWE) |
| 13 | Gallery | `/gallery` | Categorized albums, lightbox |
| 14 | FAQ & Contact | `/faq`, `/contact` | Membership eligibility, lab locations, contact form |

Global: responsive, accessible (WCAG AA), SEO metadata + OpenGraph, sitemap, `loading.tsx`/`error.tsx`/`not-found.tsx` on every route group.

---

## 8. Admin Panel Modules (`/admin/*`)

| ID | Module | Route | Capabilities |
|---|---|---|---|
| A-01 | Dashboard & Analytics | `/admin` | Cards: total active members, pending applications, event registrations, issued certificates. Chart: wing-wise member distribution |
| A-02 | Membership Manager | `/admin/members` | Review applications, verify `XXX-35-XXX` IDs, approve/reject, revoke/reissue Digital Member ID Card, **export CSV** |
| A-03 | Committee & Sessions | `/admin/committee` | Create sessions, add/edit/**drag-reorder** members, assign titles, upload portraits, archive past panels |
| A-04 | Wings & Rosters | `/admin/wings` | Manage 5 wings, assign Wing Leads, edit core rosters and syllabi |
| A-05 | Events, Courses & Attendance | `/admin/events` | Create/publish events, set capacity, live registrations, **QR check-in scanner**, mark attendance |
| A-06 | Certification Engine | `/admin/certificates` | Generate unique IDs, **bulk-issue PDFs** with embedded QR → `/verify/[certId]`, revoke |
| A-07 | Magazine CMS | `/admin/magazine` | Upload issue PDFs, approve/edit student articles, issue numbers, feature flagship |
| A-08 | Project Moderation | `/admin/projects` | Review submissions, verify GitHub links, assign tags, toggle featured |
| A-09 | Hall of Fame Curator | `/admin/hall-of-fame` | Add/verify entries (ICPC/NCPC, hackathon, GSoC, alumni) |
| A-10 | Notice Board | `/admin/notices` | Publish, pin, **schedule**, expire notices |
| A-11 | Resources, Sponsors & Media | `/admin/resources`, `/admin/sponsors`, `/admin/gallery` | CP sheets/roadmaps, sponsor logos, faculty profiles, photo albums |
| A-12 | RBAC & Audit Logs | `/admin/access`, `/admin/audit` | Manage roles, view/filter immutable audit log |

### RBAC Matrix (`src/backend/shared/rbac.ts`)

| Module | Super Admin (President) | General Secretary | Wing Lead | Publication Editor |
|---|:-:|:-:|:-:|:-:|
| A-01 Dashboard | ✅ | ✅ | ✅ (own wing) | ✅ (read) |
| A-02 Members | ✅ | ✅ | read (own wing) | ❌ |
| A-03 Committee | ✅ | ✅ | ❌ | ❌ |
| A-04 Wings | ✅ | ✅ | ✅ (own wing) | ❌ |
| A-05 Events | ✅ | ✅ | ✅ (own wing events) | ❌ |
| A-06 Certificates | ✅ | ✅ | issue (own events) | ❌ |
| A-07 Magazine | ✅ | ✅ | ❌ | ✅ |
| A-08 Projects | ✅ | ✅ | ✅ | ✅ |
| A-09 Hall of Fame | ✅ | ✅ | ❌ | ✅ |
| A-10 Notices | ✅ | ✅ | ❌ | ✅ |
| A-11 Resources/Media | ✅ | ✅ | ✅ (resources) | ✅ (media) |
| A-12 RBAC & Audit | ✅ | read audit only | ❌ | ❌ |

Rules:
- SSO via Google, **only `@diu.edu.bd`** accounts; reject all others at sign-in.
- A user with no assigned role gets no admin access.
- Enforce permissions **on the server** (middleware + inside every server action). Hiding UI is not enough.
- **Every** create/update/delete/approve/revoke must call `writeAudit()`. Audit log is read-only for everyone.

---

## 9. Key Flows (implement exactly)

**Membership application**
1. Visitor submits form → Zod validates ID + email → duplicate check on ID/email.
2. Member saved as `PENDING`; instant Digital ID Card preview shown (marked "Pending approval" until approved).
3. Admin approves → card becomes active, `memberCardNo` assigned. Reject/revoke → card shows invalid.

**Event registration & check-in**
1. Registration decrements available seats atomically (transaction); block when full.
2. Each registration gets a unique `qrToken`; QR shown/emailed.
3. Admin scans QR at `/admin/events/[id]/checkin` → sets `checkedInAt`, prevents double check-in.

**Certificate issuance**
1. Admin selects event + recipients (or CSV) → bulk generate `DIU-SEC-CERT-XXXX` IDs.
2. Render PDF with name, type, date, ID, and QR pointing to `${SITE_URL}/verify/<certId>`; store PDF.
3. Public verify page shows VALID/REVOKED/NOT FOUND. Revocation is instant and audited.

---

## 10. Build Order

Work in phases. Finish each phase (it builds, lints, typechecks, and works) before starting the next. Commit after each phase: `feat(phase-N): ...`.

### Phase 0 — Foundation
- [x] Init Next.js + TS + Tailwind + shadcn/ui, ESLint, Prettier, pnpm scripts
- [x] Generate design system with UI/UX Pro Max → `docs/design-system.md`; define Tailwind tokens from it
- [x] Prisma schema (Section 6), first migration, `seed.ts` (super admin, 5 wings, sample session, sample data)
- [x] `validators.ts` with ID/email/cert regexes + unit tests
- [x] Layouts: public shell (nav/footer) and admin shell (sidebar)

### Phase 1 — Auth, RBAC, Audit
- [x] Auth.js Google SSO, domain restriction, session with role
- [x] `rbac.ts` + route middleware for `/admin/*`
- [x] `audit.ts` + append-only enforcement
- [x] A-12 pages (roles, audit viewer with filters)

### Phase 2 — Membership (04 + A-02)
- [x] Public `/join` form + ID card generation
- [x] Admin review queue, approve/reject/revoke/reissue, CSV export

### Phase 3 — Committee & Wings (02, 03 + A-03, A-04)
- [x] Sessions, committee CRUD with reorder + portrait upload
- [x] Wings CRUD, lead assignment, rosters, syllabi

### Phase 4 — Events & Attendance (05 + A-05)
- [x] Event CRUD/publish, seat counter, registration with transaction
- [x] QR generation and scan check-in

### Phase 5 — Certification (09 + A-06)
- [x] ID generator, bulk PDF with QR, public verify page, revoke

### Phase 6 — Content CMS (06, 07, 08, 10 + A-07 to A-10)
- [x] Magazine, Hall of Fame, Projects (with GitHub link check), Notices (schedule/expire/pin)

### Phase 7 — Supporting modules (11–14 + A-11)
- [x] Resources, Partners/Sponsors/Faculty, Gallery, FAQ & Contact

### Phase 8 — Landing page & Dashboard (01 + A-01)
- [x] Intro page with metrics + CTAs
- [x] Dashboard cards and wing distribution chart

### Phase 9 — Hardening
- [x] Rate limiting on public forms, honeypot/captcha on `/join` and `/contact`
- [x] SEO, sitemap, OG images, a11y pass, Lighthouse ≥ 90
- [x] Playwright e2e for: join flow, registration + check-in, cert issue + verify, RBAC denial
- [x] Deployment docs (Vercel + managed Postgres)

---

## 11. Definition of Done (every feature)

1. Matches the module table in Sections 7/8.
2. Server-side validation with Zod; no trust in client input.
3. Server-side permission check; audit log entry for every mutation.
4. Loading, empty, and error states handled.
5. Mobile-responsive (≥ 360px) and keyboard accessible.
6. `pnpm lint && pnpm typecheck && pnpm test` pass.
7. Seed data lets the feature be demoed without manual setup.

---

## 12. Rules for OpenCode / AI Agents (also save as `AGENTS.md`)

- Read this README fully before writing code. Follow Build Order; one phase at a time.
- Use only the stack in Section 1. Do not add major dependencies without logging why in `docs/DECISIONS.md`.
- Keep ID/email/cert regexes in `src/backend/shared/validators.ts` only — never duplicate them.
- All mutations go through server actions in `src/backend/features/<domain>/*`, which must: (1) authenticate, (2) authorize via `rbac.ts`, (3) validate via Zod, (4) write, (5) call `writeAudit()`.
- Never hard-delete audit logs; never expose an edit/delete path for them.
- Never commit secrets. Use `.env.example` for new variables.
- Fix the whole class of a bug, not just one instance (e.g., if a permission check is missing in one action, check all actions).
- After each phase: run lint, typecheck, tests; fix failures; then commit.
- When blocked or ambiguous: choose the simplest reasonable option, document it, move on. Do not stop to ask unless a decision is destructive.
- Keep responses and commit messages concise.

---

## 13. Source Requirements

Canonical requirement text (Markdown, agent-readable):
- `docs/requirements/website.md` — modules 01–14
- `docs/requirements/admin-panel.md` — modules A-01 to A-12

Original PDFs are archived in `docs/archive/` for humans only. Agents must NOT read them. If the README and a requirements file disagree, the requirements file wins; log the conflict in `docs/DECISIONS.md`.

---

## License

MIT (or as decided by the DIU SEC executive panel).
