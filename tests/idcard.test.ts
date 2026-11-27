import { describe, expect, it, vi } from "vitest";
import { nextMemberCardNo } from "@/lib/idcard";

describe("nextMemberCardNo", () => {
  it("continues the current-year sequence", async () => {
    const tx = { member: { count: vi.fn().mockResolvedValue(1) } };
    expect(await nextMemberCardNo(tx as never, new Date("2026-06-01T00:00:00Z"))).toBe("SEC-2026-0002");
    expect(tx.member.count).toHaveBeenCalledWith({ where: { memberCardNo: { startsWith: "SEC-2026-" } } });
  });

  it("starts a new year at 0001", async () => {
    const tx = { member: { count: vi.fn().mockResolvedValue(0) } };
    expect(await nextMemberCardNo(tx as never, new Date("2027-01-01T00:00:00Z"))).toBe("SEC-2027-0001");
  });
});
