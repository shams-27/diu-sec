import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
  writeAudit: vi.fn(),
  transaction: vi.fn(),
  rateLimited: vi.fn(),
  isBot: vi.fn(),
}));
const tx = { member: { create: m.create } };
m.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx));
vi.mock("@/lib/db", () => ({
  db: { member: { findFirst: m.findFirst }, $transaction: (fn: (tx: unknown) => Promise<unknown>) => m.transaction(fn) },
}));
vi.mock("@/lib/audit", () => ({ writeAudit: m.writeAudit }));
vi.mock("@/lib/rate-limit", () => ({ rateLimited: m.rateLimited }));
vi.mock("@/lib/honeypot", () => ({ isBot: m.isBot, HONEYPOT_FIELD: "website" }));

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
  beforeEach(() => {
    vi.clearAllMocks();
    m.rateLimited.mockResolvedValue(false);
    m.isBot.mockReturnValue(false);
  });

  it("silently drops a honeypot submission without writing", async () => {
    m.isBot.mockReturnValue(true);

    await expect(submitMembershipAction({}, application())).resolves.toEqual({});
    expect(m.rateLimited).not.toHaveBeenCalled();
    expect(m.findFirst).not.toHaveBeenCalled();
    expect(m.create).not.toHaveBeenCalled();
    expect(m.writeAudit).not.toHaveBeenCalled();
  });

  it("blocks an over-rate application before any write", async () => {
    m.rateLimited.mockResolvedValue(true);

    const result = await submitMembershipAction({}, application());

    expect(result.error).toMatch(/too many/i);
    expect(m.findFirst).not.toHaveBeenCalled();
    expect(m.create).not.toHaveBeenCalled();
    expect(m.writeAudit).not.toHaveBeenCalled();
  });

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
