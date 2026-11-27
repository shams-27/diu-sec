import { describe, expect, it, vi } from "vitest";
import { nextMemberCardNo } from "@/backend/features/membership/idcard";
import { fitText } from "@/frontend/features/membership/member-id-card";

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

describe("fitText", () => {
  it("truncates text that would run past the card edge", () => {
    const ctx = { measureText: (text: string) => ({ width: text.length * 20 }) };
    const fitted = fitText(ctx as never, "A".repeat(100), 888);
    expect(ctx.measureText(fitted).width).toBeLessThanOrEqual(888);
    expect(fitted).not.toBe("A".repeat(100));
  });

  it("leaves short text unchanged", () => {
    const ctx = { measureText: (text: string) => ({ width: text.length * 20 }) };
    expect(fitText(ctx as never, "Jane Doe", 888)).toBe("Jane Doe");
  });
});
