import { headers } from "next/headers";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 30;
const MAX_ENTRIES = 5000;
const buckets = new Map<string, { start: number; count: number }>();

/** Per-process, in-memory limiting; a multi-instance deployment needs a shared store.
 *  Only trust x-forwarded-for when the edge overwrites it; clients can spoof it otherwise.
 */
export async function rateLimited(bucket: string): Promise<boolean> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  let entry = buckets.get(key);

  if (!entry || now - entry.start >= WINDOW_MS) entry = { start: now, count: 0 };
  if (entry.count >= LIMIT) return true;
  entry.count++;
  buckets.set(key, entry);

  if (buckets.size > MAX_ENTRIES) {
    for (const [storedKey, stored] of buckets) {
      if (now - stored.start >= WINDOW_MS) buckets.delete(storedKey);
    }
    while (buckets.size > MAX_ENTRIES) {
      const oldest = buckets.keys().next().value;
      if (!oldest) break;
      buckets.delete(oldest);
    }
  }
  return false;
}
