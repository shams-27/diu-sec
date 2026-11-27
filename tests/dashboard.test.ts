import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  memberCount: vi.fn(),
  registrationCount: vi.fn(),
  certificateCount: vi.fn(),
  memberGroupBy: vi.fn(),
  wingFindMany: vi.fn(),
}));

vi.mock("@/backend/shared/db", () => ({
  db: {
    member: { count: m.memberCount, groupBy: m.memberGroupBy },
    registration: { count: m.registrationCount },
    certificate: { count: m.certificateCount },
    wing: { findMany: m.wingFindMany },
  },
}));

import { dashboardData, dashboardScopes } from "@/backend/features/dashboard/queries";

describe("dashboardScopes", () => {
  it("limits a wing lead's counts and chart to their own wing", () => {
    expect(dashboardScopes({ role: "WING_LEAD", wingId: "wing-web" })).toEqual({
      member: { wingPrefId: "wing-web" },
      event: { event: { wingId: "wing-web" } },
      wing: { id: "wing-web" },
    });
  });

  it.each(["GENERAL_SECRETARY", "PUBLICATION_EDITOR", "SUPER_ADMIN"] as const)(
    "leaves %s counts unscoped even when they have a wing",
    (role) => {
      expect(dashboardScopes({ role, wingId: "wing-web" })).toEqual({
        member: {},
        event: {},
        wing: {},
      });
    },
  );

  it("fails closed for a wing lead with no wing", () => {
    expect(dashboardScopes({ role: "WING_LEAD" })).toEqual({
      member: { wingPrefId: "" },
      event: { event: { wingId: "" } },
      wing: { id: "" },
    });
  });
});

describe("dashboardData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.memberCount.mockResolvedValue(1);
    m.registrationCount.mockResolvedValue(2);
    m.certificateCount.mockResolvedValue(3);
    m.memberGroupBy.mockResolvedValue([{ wingPrefId: "wing-web", _count: { _all: 1 } }]);
    m.wingFindMany.mockResolvedValue([{ id: "wing-web", name: "Web & Mobile Development" }]);
  });

  it("limits a wing lead's queries to their own wing", async () => {
    const data = await dashboardData({ role: "WING_LEAD", wingId: "wing-web" });

    expect(m.memberCount).toHaveBeenNthCalledWith(1, { where: { status: "APPROVED", wingPrefId: "wing-web" } });
    expect(m.memberCount).toHaveBeenNthCalledWith(2, { where: { status: "PENDING", wingPrefId: "wing-web" } });
    expect(m.registrationCount).toHaveBeenCalledWith({ where: { status: "CONFIRMED", event: { wingId: "wing-web" } } });
    expect(m.certificateCount).toHaveBeenCalledWith({ where: { event: { wingId: "wing-web" } } });
    expect(m.memberGroupBy).toHaveBeenCalledWith({
      by: ["wingPrefId"],
      where: { status: "APPROVED", wingPrefId: "wing-web" },
      _count: { _all: true },
    });
    expect(m.wingFindMany).toHaveBeenCalledWith({
      where: { id: "wing-web" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    expect(data.chart).toEqual([{ name: "Web & Mobile Development", members: 1 }]);
  });

  it("gives an editor unscoped queries and all wings in the chart", async () => {
    m.memberGroupBy.mockResolvedValue([
      { wingPrefId: "wing-web", _count: { _all: 1 } },
      { wingPrefId: "wing-ai", _count: { _all: 4 } },
    ]);
    m.wingFindMany.mockResolvedValue([
      { id: "wing-ai", name: "AI/ML" },
      { id: "wing-web", name: "Web & Mobile Development" },
    ]);

    const data = await dashboardData({ role: "PUBLICATION_EDITOR" });

    expect(m.memberCount).toHaveBeenNthCalledWith(1, { where: { status: "APPROVED" } });
    expect(m.wingFindMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    expect(data.chart).toEqual([
      { name: "AI/ML", members: 4 },
      { name: "Web & Mobile Development", members: 1 },
    ]);
  });
});
