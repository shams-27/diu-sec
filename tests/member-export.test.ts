import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/rbac";

const m = vi.hoisted(() => ({ requireActor: vi.fn(), findMany: vi.fn(), connection: vi.fn() }));
vi.mock("@/lib/admin-guard", () => ({ requireActor: m.requireActor }));
vi.mock("@/lib/db", () => ({ db: { member: { findMany: m.findMany } } }));
vi.mock("next/server", () => ({ connection: m.connection }));

import { GET } from "@/app/api/admin/members/export/route";

const WING = "cmwypjwan0000sbfjk8ca2z4k";
const request = (url: string) => ({ nextUrl: new URL(url) }) as never;

describe("member CSV export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.findMany.mockResolvedValue([]);
  });

  it("denies a role-less session before reading members", async () => {
    m.requireActor.mockRejectedValue(new ForbiddenError());

    await expect(GET(request("http://localhost/api/admin/members/export"))).rejects.toThrow(ForbiddenError);
    expect(m.findMany).not.toHaveBeenCalled();
  });

  it("ignores another wing's ID in the query for a wing lead", async () => {
    m.requireActor.mockResolvedValue({ id: "u1", role: "WING_LEAD", wingId: "w1" });

    const response = await GET(request("http://localhost/api/admin/members/export?wingPrefId=w2"));

    expect(response.status).toBe(200);
    expect(m.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: undefined, wingPrefId: "w1" } }));
  });

  it("applies status and wing filters for an admin", async () => {
    m.requireActor.mockResolvedValue({ id: "u1", role: "SUPER_ADMIN", wingId: null });

    await GET(request(`http://localhost/api/admin/members/export?status=PENDING&wingPrefId=${WING}`));

    expect(m.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "PENDING", wingPrefId: WING } }));
  });

  it("escapes quotes and spreadsheet formulas in exported cells", async () => {
    m.requireActor.mockResolvedValue({ id: "u1", role: "SUPER_ADMIN", wingId: null });
    m.findMany.mockResolvedValue([
      {
        name: '=cmd|"A1"',
        studentId: "221-35-100",
        email: "demo@diu.edu.bd",
        batch: null,
        phone: null,
        status: "PENDING",
        memberCardNo: null,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        wingPref: null,
      },
    ]);

    const response = await GET(request("http://localhost/api/admin/members/export"));
    const body = await response.text();

    expect(body).toContain('"\'=cmd|""A1"""');
    expect(response.headers.get("content-disposition")).toContain("attachment");
  });
});
