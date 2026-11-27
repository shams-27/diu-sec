import { beforeEach, describe, expect, it, vi } from "vitest";

const e = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/backend/shared/db", () => ({ db: { event: { findMany: e.findMany } } }));

import { getPublishedEvents } from "@/backend/features/events/queries";

describe("getPublishedEvents", () => {
  const now = new Date("2026-11-28T00:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
    e.findMany.mockResolvedValue([]);
  });

  it("filters upcoming events in the database query", async () => {
    await getPublishedEvents("upcoming", now);
    expect(e.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "PUBLISHED", startsAt: { gte: now } } }));
  });

  it("filters past events in the database query", async () => {
    await getPublishedEvents("past", now);
    expect(e.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "PUBLISHED", startsAt: { lt: now } } }));
  });
});
