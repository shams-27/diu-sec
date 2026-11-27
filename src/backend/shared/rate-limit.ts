import { headers } from "next/headers";
import { db } from "@/backend/shared/db";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 30;
let lastCleanup = 0;

/**
 * Shared Postgres counter: every app instance sees the same bucket. Deployments must
 * have the edge overwrite x-forwarded-for; a client-supplied value can bypass any IP limit.
 */
export async function rateLimited(bucket: string): Promise<boolean> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";
  const key = `${bucket}:${ip}`;
  const now = new Date();
  const cutoff = new Date(now.getTime() - WINDOW_MS);

  const rows = await db.$queryRaw<{ count: number }[]>`
    WITH input AS (SELECT ${key} AS key, ${now} AS now, ${cutoff} AS cutoff)
    INSERT INTO "RateLimitBucket" ("key", "windowStart", "count", "createdAt", "updatedAt")
    SELECT key, now, 1, now, now FROM input
    ON CONFLICT ("key") DO UPDATE SET
      "windowStart" = CASE WHEN "RateLimitBucket"."windowStart" <= (SELECT cutoff FROM input) THEN (SELECT now FROM input) ELSE "RateLimitBucket"."windowStart" END,
      "count" = CASE WHEN "RateLimitBucket"."windowStart" <= (SELECT cutoff FROM input) THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "updatedAt" = (SELECT now FROM input)
    RETURNING "count"
  `;

  // Bound table growth without a scheduler; a shared cleanup job can replace this at scale.
  if (now.getTime() - lastCleanup > 60 * 60 * 1000) {
    lastCleanup = now.getTime();
    await db.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "windowStart" < ${new Date(now.getTime() - 24 * 60 * 60 * 1000)}`;
  }

  return Number(rows[0].count) > LIMIT;
}
