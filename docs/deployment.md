# Deployment

## Prerequisites

- Node 20+, pnpm, PostgreSQL 14+ (managed Postgres in production).
- A Google OAuth client with an authorized redirect URI of `${NEXT_PUBLIC_SITE_URL}/api/auth/callback/google`.
- The deploy host must be trusted by Auth.js; `trustHost: true` is already set. Use a stable origin so cookies, QR links and sitemap URLs agree.

## Environment

Copy `.env.example` into the platform's environment settings and fill every value:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Managed Postgres connection string; use pooled connections for serverless. |
| `AUTH_SECRET` | `openssl rand -base64 32`; keep it stable across deployments. |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth client credentials. Sign-in accepts verified `@diu.edu.bd` addresses only, enforced by the shared validator. |
| `NEXT_PUBLIC_SITE_URL` | Public origin, no trailing slash. Used for metadata, sitemap, robots and certificate QR URLs. |
| `SUPER_ADMIN_EMAIL` | Provisioned as the first Super Admin by the seed; must be a real `@diu.edu.bd` account. |
| `STORAGE_DRIVER`, `S3_*` | Reserved for S3-compatible storage; see the storage limitation below. |

Never commit `.env` or secrets.

## First deploy

```bash
pnpm install --frozen-lockfile
pnpm prisma migrate deploy
BOOTSTRAP_ONLY=true SUPER_ADMIN_EMAIL=...@diu.edu.bd pnpm prisma db seed
pnpm build
```

`BOOTSTRAP_ONLY=true` creates only the super admin and the five wings. The default `pnpm prisma db seed` adds demo members, events, certificates and content; use it for local/demo databases, not production. The initial migration installs the `AuditLog` update/delete trigger; keep it in place—audit rows are append-only.

Subsequent deploys run `pnpm prisma migrate deploy` then `pnpm build`. Do not run `prisma db push` in production; it bypasses migration history and the trigger.

## Vercel

1. Import the repo and set the environment variables above.
2. Point `DATABASE_URL` at the managed Postgres instance (pooled URL for the app; direct URL for migrations if the provider separates them).
3. Build command `pnpm build`; output preset is detected by Next.js.
4. Add the Google redirect URI for the deployed origin and verify sign-in with an `@diu.edu.bd` account.
5. Check `/sitemap.xml`, `/robots.txt` and `/opengraph-image` after the first deploy.

**Storage limitation:** uploads and generated certificate PDFs currently go to `public/uploads` through `src/lib/storage.ts`. On Vercel's read-only/ephemeral filesystem those files will not persist. Deploy on a host with persistent storage until an S3-compatible adapter replaces `writeAsset()`; `STORAGE_DRIVER`/`S3_*` are not wired up yet.

## Self-hosted / persistent host

```bash
pnpm start --port 3000
```

Serve behind a TLS reverse proxy that **overwrites** `x-forwarded-for` with the real client address; the rate limiter reads it for public form submissions and a client-supplied value would bypass the limit. Keep `public/uploads` on a persistent volume with write access for the app user.

## Operational notes

- Rate limiting is **per process**: 30 submissions per 10 minutes per IP on `/join`, `/contact` and event registration, with at most 5,000 tracked IPs per process. Multiple instances need a shared store (Redis or equivalent) before horizontal scaling.
- Homepage events/wings use the `minutes` cache profile (5-minute client stale, 1-minute server revalidation, 1-hour expiry) and are invalidated by event/wing changes; its Suspense fallback reserves space so revalidation does not shift the page.
- Honeypot fields are hidden from users and keyboard focus; bots that fill them are rejected silently.
- RBAC is enforced in server actions and the `/admin` proxy; roles come from the `User` table on every JWT callback, so demotions take effect on the next request.
- Audit logs are read-only in the UI and blocked by a database trigger; do not grant the app role `UPDATE`/`DELETE` on `AuditLog` beyond what migrations create.
- Verify a generated certificate end to end after deploy: issue from `/admin/certificates`, scan/open the QR URL, confirm VALID, then revoke and confirm REVOKED.

## Local verification

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm exec playwright install chromium
pnpm start --port 3003
pnpm e2e
```

E2E assumes a demo-seeded database and a server on port 3003; `playwright.config.ts` reuses an existing server locally and starts its own in CI.
