import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
  writeAudit: vi.fn(),
  transaction: vi.fn(),
}));
const tx = { member: { create: m.create } };
m.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx));
vi.mock("@/lib/db", () => ({
  db: { member: { findFirst: m.findFirst }, $transaction: (fn: (tx: unknown) => Promise<unknown>) => m.transaction(fn) },
}));
vi.mock("@/lib/audit", () => ({ writeAudit: m.writeAudit }));

import { submitMembershipAction } from "@/server/actions/members";

function application(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const values = {
    name: "Jane Doe",
    studentId: "221-35-123",
    email: "Jane@diu.edu.bd",
    batch: "2022",
    phone: "",
    wingPrefId: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("submitMembershipAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a bad student ID and email before any write", async () => {
    const result = await submitMembershipAction({}, application({ studentId: "nope", email: "jane@gmail.com" }));

    expect(result.error).toBeTruthy();
    expect(m.create).not.toHaveBeenCalled();
    expect(m.writeAudit).not.toHaveBeenCalled();
  });

  it("rejects a duplicate without writing or auditing", async () => {
    m.findFirst.mockResolvedValue({ id: "existing" });

    const result = await submitMembershipAction({}, application());

    expect(result.error).toMatch(/already/i);
    expect(m.create).not.toHaveBeenCalled();
    expect(m.writeAudit).not.toHaveBeenCalled();
  });

  it("creates a pending member and audits the applicant", async () => {
    m.findFirst.mockResolvedValue(null);
    m.create.mockResolvedValue({ id: "m1" });

    const result = await submitMembershipAction({}, application({ wingPrefId: "cmwypjwan0000sbfjk8ca2z4k" }));

    expect(result).toEqual({ memberId: "m1" });
    expect(m.create).toHaveBeenCalledWith({
      select: { id: true },
      data: expect.objectContaining({
        studentId: "221-35-123",
        email: "jane@diu.edu.bd",
        wingPrefId: "cmwypjwan0000sbfjk8ca2z4k",
        status: "PENDING",
      }),
    });
    expect(m.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: null,
        actorEmail: "jane@diu.edu.bd",
        action: "CREATE",
        entity: "Member",
        entityId: "m1",
      }),
      tx,
    );
  });
});
