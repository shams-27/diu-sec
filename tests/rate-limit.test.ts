import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ get: vi.fn(), queryRaw: vi.fn(), executeRaw: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => ({ get: m.get }) }));
vi.mock("@/backend/shared/db", () => ({ db: { $queryRaw: m.queryRaw, $executeRaw: m.executeRaw } }));

import { HONEYPOT_FIELD, isBot } from "@/backend/shared/honeypot";
import { rateLimited } from "@/backend/shared/rate-limit";

const LIMIT = 30;

function setIp(ip: string) {
  m.get.mockImplementation((name: string) => (name === "x-forwarded-for" ? ip : null));
}

/** Simulates the shared Postgres counter: the first three SQL parameters are key, now and cutoff. */
function sharedCounter() {
  const buckets = new Map<string, { start: number; count: number }>();
  m.queryRaw.mockImplementation(async (_sql: unknown, key: string, now: Date, cutoff: Date) => {
    let entry = buckets.get(key);
    if (!entry || entry.start <= cutoff.getTime()) entry = { start: now.getTime(), count: 0 };
    entry.count += 1;
    buckets.set(key, entry);
    return [{ count: entry.count }];
  });
}

describe("rateLimited", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-27T10:00:00Z"));
    setIp("203.0.113.4");
    m.executeRaw.mockResolvedValue(0);
    sharedCounter();
  });

  afterEach(() => vi.useRealTimers());

  it(`allows ${LIMIT} requests then blocks the next from the same IP`, async () => {
    const results = [];
    for (let i = 0; i <= LIMIT; i++) results.push(await rateLimited("join-five"));
    expect(results).toEqual([...Array(LIMIT).fill(false), true]);
  });

  it("allows requests again after the window closes", async () => {
    for (let i = 0; i < LIMIT; i++) await rateLimited("join-window");
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    expect(await rateLimited("join-window")).toBe(false);
  });

  it("keeps different IPs in separate buckets", async () => {
    for (let i = 0; i < LIMIT; i++) await rateLimited("join-ip");
    setIp("203.0.113.9");
    expect(await rateLimited("join-ip")).toBe(false);
  });

  it("does not reset a bucket when many other IPs arrive", async () => {
    for (let i = 0; i < LIMIT; i++) await rateLimited("join-flood");
    expect(await rateLimited("join-flood")).toBe(true);
    for (let i = 0; i < 5100; i++) {
      setIp(`198.51.100.${i}`);
      await rateLimited("join-flood");
    }
    setIp("203.0.113.4");
    expect(await rateLimited("join-flood")).toBe(true);
    expect(m.queryRaw).toHaveBeenCalledTimes(5100 + LIMIT + 2);
  });

  it("uses the shared database counter on every request", async () => {
    await rateLimited("join-shared");
    expect(m.queryRaw).toHaveBeenCalledTimes(1);
    expect(m.queryRaw.mock.calls[0][0]).toEqual(expect.arrayContaining([expect.stringContaining("RateLimitBucket")]));
  });
});

describe("isBot", () => {
  it("detects a filled honeypot and ignores an empty one", () => {
    const clean = new FormData();
    clean.set("email", "jane@diu.edu.bd");
    const bot = new FormData();
    bot.set("email", "jane@diu.edu.bd");
    bot.set(HONEYPOT_FIELD, "spam.example");
    expect(isBot(clean)).toBe(false);
    expect(isBot(bot)).toBe(true);
  });
});
