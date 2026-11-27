import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/backend/shared/rbac";

const m = vi.hoisted(() => ({
  requireActor: vi.fn(),
  findUnique: vi.fn(),
  count: vi.fn(),
  update: vi.fn(),
  writeAudit: vi.fn(),
  revalidatePath: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/backend/shared/admin-guard", () => ({ requireActor: m.requireActor }));
vi.mock("@/backend/shared/audit", () => ({ writeAudit: m.writeAudit }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath, updateTag: vi.fn() }));
vi.mock("@/backend/shared/db", () => ({
  db: {
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => m.transaction(fn),
  },
}));

const tx = {
  member: { findUnique: m.findUnique, count: m.count, update: m.update },
};
m.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx));

import { reviewMemberAction } from "@/server/actions/member-review";

const ID = "cmwypjwan0000sbfjk8ca2z4k";

function form(decision: string): FormData {
  const data = new FormData();
  data.set("memberId", ID);
  data.set("decision", decision);
  return data;
}

describe("reviewMemberAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
    m.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx));
    m.findUnique.mockResolvedValue({ id: ID, status: "PENDING", wingPrefId: null });
    m.count.mockResolvedValue(1);
  });

  afterEach(() => vi.useRealTimers());

  it("denies a write before touching the database", async () => {
    m.requireActor.mockRejectedValue(new ForbiddenError());

    await expect(reviewMemberAction(form("APPROVE"))).rejects.toThrow(ForbiddenError);
    expect(m.findUnique).not.toHaveBeenCalled();
    expect(m.update).not.toHaveBeenCalled();
    expect(m.writeAudit).not.toHaveBeenCalled();
  });

  it("denies a wing lead reviewing another wing's member", async () => {
    m.requireActor.mockResolvedValue({ id: "u1", role: "WING_LEAD", wingId: "w1" });
    m.findUnique.mockResolvedValue({ id: ID, status: "PENDING", wingPrefId: "w2" });

    await expect(reviewMemberAction(form("APPROVE"))).rejects.toThrow(ForbiddenError);
    expect(m.update).not.toHaveBeenCalled();
    expect(m.writeAudit).not.toHaveBeenCalled();
  });

  it("approves once, allocating one card number and writing both snapshots", async () => {
    m.requireActor.mockResolvedValue({ id: "u1", role: "SUPER_ADMIN", wingId: null });
    const before = { status: "PENDING", memberCardNo: null };
    m.findUnique.mockResolvedValue({ id: ID, ...before });

    await reviewMemberAction(form("APPROVE"));

    expect(m.update).toHaveBeenCalledTimes(1);
    expect(m.update).toHaveBeenCalledWith({
      where: { id: ID },
      data: { status: "APPROVED", memberCardNo: "SEC-2026-0002", cardIssuedAt: expect.any(Date) },
    });
    expect(m.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "u1",
        action: "APPROVE",
        entity: "Member",
        entityId: ID,
        before: expect.objectContaining(before),
        after: expect.objectContaining({ status: "APPROVED", memberCardNo: "SEC-2026-0002" }),
      }),
      tx,
    );
    expect(m.revalidatePath).toHaveBeenCalledWith("/admin/members");
  });

  it.each([["REJECT", "REJECTED"], ["REVOKE", "REVOKED"]] as const)(
    "maps %s to the %s member status",
    async (decision, status) => {
      m.requireActor.mockResolvedValue({ id: "u1", role: "SUPER_ADMIN", wingId: null });

      await reviewMemberAction(form(decision));

      expect(m.update).toHaveBeenCalledWith({ where: { id: ID }, data: { status } });
      expect(m.writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: decision, after: expect.objectContaining({ status }) }),
        tx,
      );
    },
  );

  it("does not re-approve an already approved member", async () => {
    m.requireActor.mockResolvedValue({ id: "u1", role: "SUPER_ADMIN", wingId: null });
    m.findUnique.mockResolvedValue({ id: ID, status: "APPROVED", memberCardNo: "SEC-2026-0001" });

    await reviewMemberAction(form("APPROVE"));

    expect(m.update).not.toHaveBeenCalled();
    expect(m.writeAudit).not.toHaveBeenCalled();
  });
});
