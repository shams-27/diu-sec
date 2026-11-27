import { describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/backend/shared/rbac";

const m = vi.hoisted(() => {
  const requireActor = vi.fn();
  const findUnique = vi.fn();
  const count = vi.fn();
  const userUpdate = vi.fn();
  const writeAudit = vi.fn();
  const revalidatePath = vi.fn();
  const tx = { user: { findUnique, count, update: userUpdate }, auditLog: { create: vi.fn() } };
  const transaction = vi.fn(async (fn: (client: typeof tx) => Promise<void>) => fn(tx));
  return { requireActor, findUnique, count, userUpdate, writeAudit, revalidatePath, transaction };
});

vi.mock("@/backend/shared/admin-guard", () => ({ requireActor: m.requireActor }));
vi.mock("@/backend/shared/audit", () => ({ writeAudit: m.writeAudit }));
vi.mock("@/backend/shared/db", () => ({
  db: { user: { findUnique: m.findUnique, count: m.count }, $transaction: m.transaction },
}));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath, updateTag: vi.fn() }));

function form(role: string, wingId = ""): FormData {
  const data = new FormData();
  data.set("userId", "u1");
  data.set("role", role);
  data.set("wingId", wingId);
  return data;
}

describe("setUserRoleAction", () => {
  it("denies a caller without access write before any write or audit", async () => {
    vi.clearAllMocks();
    m.requireActor.mockRejectedValue(new ForbiddenError());
    const { setUserRoleAction } = await import("@/backend/features/access/access");

    await expect(setUserRoleAction(form("SUPER_ADMIN"))).rejects.toThrow(ForbiddenError);
    expect(m.requireActor).toHaveBeenCalledWith("access", "write");
    expect(m.userUpdate).not.toHaveBeenCalled();
    expect(m.writeAudit).not.toHaveBeenCalled();
  });

  it("writes the role and audits it with the session actor", async () => {
    vi.clearAllMocks();
    m.requireActor.mockResolvedValue({ id: "actor-1", role: "SUPER_ADMIN" });
    m.findUnique.mockResolvedValue({ role: "WING_LEAD", wingId: "w1" });
    m.count.mockResolvedValue(2);
    const { setUserRoleAction } = await import("@/backend/features/access/access");

    await setUserRoleAction(form(""));

    expect(m.userUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { role: null, wingId: null },
    });
    expect(m.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "actor-1",
        action: "UPDATE",
        entity: "User",
        entityId: "u1",
        after: { role: null, wingId: null },
      }),
      expect.anything(),
    );
    expect(m.revalidatePath).toHaveBeenCalledWith("/admin/access");
  });

  it("refuses to demote the last super admin", async () => {
    vi.clearAllMocks();
    m.requireActor.mockResolvedValue({ id: "actor-1", role: "SUPER_ADMIN" });
    m.findUnique.mockResolvedValue({ role: "SUPER_ADMIN", wingId: null });
    m.count.mockResolvedValue(1);
    const { setUserRoleAction } = await import("@/backend/features/access/access");

    await expect(setUserRoleAction(form("WING_LEAD"))).rejects.toThrow(/last super admin/i);
    expect(m.userUpdate).not.toHaveBeenCalled();
    expect(m.writeAudit).not.toHaveBeenCalled();
  });
});
