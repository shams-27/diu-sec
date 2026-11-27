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
SUPER_ADMIN_EMAIL=...@diu.edu.bd pnpm prisma db seed
pnpm build
```

The default seed creates only the super admin and the five wings; it never overwrites an existing admin or wing. Set `SEED_DEMO=true` to add demo members, events, certificates and content on a local/demo database. The migrations install the `AuditLog` update/delete/truncate triggers; keep them in place—audit rows are append-only.

Subsequent deploys run `pnpm prisma migrate deploy` then `pnpm build`. Do not run `prisma db push` in production; it bypasses migration history and the trigger.

## Vercel (not supported yet)

Do not deploy this app to Vercel or any serverless/ephemeral host. Uploads and generated certificate PDFs go to `public/uploads` through `src/backend/shared/storage.ts`, and those files would vanish between invocations. `STORAGE_DRIVER`/`S3_*` are documented but not wired up. Homepage `use cache` data is also invalidated per process, so multiple instances would serve stale events. Both need shared storage and a shared cache handler before serverless or horizontal scaling is supported.

## Self-hosted / persistent host (supported)

```bash
pnpm start --port 3000
```

Run **one** app instance. Uploads live on the local filesystem and homepage cache invalidation is per process, so horizontal scaling is not supported yet. Keep `public/uploads` on a persistent volume with write access for the app user. Serve behind a TLS reverse proxy that **overwrites** `x-forwarded-for` with the real client address; the rate limiter reads it for public form submissions and a client-supplied value would bypass the limit.

## Operational notes

- Rate limiting uses a shared Postgres `RateLimitBucket` table: 30 submissions per 10 minutes per IP on `/join`, `/contact` and event registration. Stale buckets are pruned hourly from each process.
- Homepage events/wings use the `minutes` cache profile (5-minute client stale, 1-minute server revalidation, 1-hour expiry) and are invalidated by event/wing changes; invalidation is process-local, which is why only one instance is supported. Its Suspense fallback reserves space so revalidation does not shift the page.
- Honeypot fields are hidden from users and keyboard focus; bots that fill them are rejected silently.
- RBAC is enforced in server actions and the `/admin` proxy; roles come from the `User` table on every JWT callback, so demotions take effect on the next request.
- Audit logs are read-only in the UI and blocked by database triggers for `UPDATE`, `DELETE` and `TRUNCATE`; do not grant those operations on `AuditLog` beyond what migrations create.
- Verify a generated certificate end to end after deploy: issue from `/admin/certificates`, scan/open the QR URL, confirm VALID, then revoke and confirm REVOKED.

## Local verification

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
SEED_DEMO=true pnpm prisma db seed
pnpm exec playwright install chromium
pnpm e2e
```

E2E assumes a demo-seeded database. `playwright.config.ts` builds the app and starts its own server on port 3003, never reusing a stale listener.
