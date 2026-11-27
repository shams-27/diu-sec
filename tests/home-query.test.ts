import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  wingFindMany: vi.fn(),
}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/backend/shared/db", () => ({
  db: {
    event: { findMany: m.findMany, findFirst: m.findFirst },
    wing: { findMany: m.wingFindMany },
  },
}));
vi.mock("@/backend/shared/cache-tags", () => ({ HOME_HIGHLIGHTS_TAG: "home-highlights" }));

import { getHomeHighlights } from "@/backend/features/home/queries";

describe("getHomeHighlights nextEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.findMany.mockResolvedValue([]);
    m.wingFindMany.mockResolvedValue([]);
    m.findFirst.mockResolvedValue(null);
  });

  it("selects the soonest event that has not ended", async () => {
    await getHomeHighlights();
    const args = m.findFirst.mock.calls[0][0];
    expect(args.where.status).toBe("PUBLISHED");
    expect(args.where.endsAt.gte).toBeInstanceOf(Date);
    expect(args.orderBy).toEqual({ startsAt: "asc" });
    expect(args.take).toBe(1);
  });

  it("returns the selected event and its reference time", async () => {
    const event = {
      id: "e1", slug: "demo", title: "Demo", type: "HACKATHON",
      startsAt: new Date("2026-11-28T00:00:00Z"), endsAt: new Date("2026-11-29T00:00:00Z"),
      capacity: 10, seatsTaken: 2,
    };
    m.findFirst.mockResolvedValue(event);
    const result = await getHomeHighlights();
    expect(result.nextEvent).toEqual(event);
    expect(Date.parse(result.nowIso)).toBeGreaterThan(0);
  });
});
