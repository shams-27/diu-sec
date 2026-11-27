import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/rbac";

const a = vi.hoisted(() => ({
  requireActor: vi.fn(),
  writeAudit: vi.fn(),
  findUnique: vi.fn(),
  upsert: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/admin-guard", () => ({ requireActor: a.requireActor }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({ writeAudit: a.writeAudit }));
vi.mock("@/lib/db", () => ({
  db: {
    committeeMember: { findUnique: a.findUnique, upsert: a.upsert },
    execSession: { create: a.create },
    wing: { findUnique: a.findUnique, update: a.update },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => a.transaction(fn),
  },
}));

const tx = {
  committeeMember: { findUnique: a.findUnique, upsert: a.upsert },
  execSession: { create: a.create },
  wing: { findUnique: a.findUnique, update: a.update },
};
a.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx));

import {
  committeeMemberSchema,
  committeeReorderSchema,
  sessionCreateSchema,
  wingRosterSchema,
  wingUpdateSchema,
} from "@/lib/validators";
import { saveCommitteeMemberAction } from "@/server/actions/committee";
import { saveWingAction } from "@/server/actions/wings";

const WING = "cmwypjwan0000sbfjk8ca2z4k";
const fd = (entries: [string, string][]) => {
  const data = new FormData();
  for (const [key, value] of entries) data.set(key, value);
  return data;
};

describe("phase 3 validators", () => {
  it("rejects a committee member without a title", () => {
    const result = committeeMemberSchema.safeParse({
      sessionId: WING,
      name: "New Member",
      title: "",
      batch: "2024",
      order: "0",
    });
    expect(result.success).toBe(false);
  });

  it("coerces a year string for a new session", () => {
    expect(sessionCreateSchema.parse({ year: "2027", label: "2027 Committee" })).toEqual({
      year: 2027,
      label: "2027 Committee",
    });
  });

  it("accepts JSON social links and a numeric order", () => {
    const result = committeeMemberSchema.parse({
      sessionId: WING,
      name: "New Member",
      title: "Lead",
      order: "2",
      socialLinks: '{"github":"https://github.com/diu-sec"}',
    });
    expect(result.order).toBe(2);
    expect(result.socialLinks).toEqual({ github: "https://github.com/diu-sec" });
  });

  it("rejects a javascript: social link and syllabus URL", () => {
    expect(
      committeeMemberSchema.safeParse({
        sessionId: WING,
        name: "New Member",
        title: "Lead",
        order: "0",
        socialLinks: '{"linkedin":"javascript:alert(1)"}',
      }).success,
    ).toBe(false);
    expect(
      wingUpdateSchema.safeParse({
        wingId: WING,
        name: "AI/ML",
        description: "Applied machine learning",
        responsibilities: "Study group",
        syllabusUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });

  it("rejects a reorder list with a non-cuid id", () => {
    expect(committeeReorderSchema.safeParse({ sessionId: WING, ids: '["nope"]' }).success).toBe(false);
  });

  it("splits wing responsibilities on newlines", () => {
    const result = wingUpdateSchema.parse({
      wingId: WING,
      name: "AI/ML",
      description: "Applied ML",
      responsibilities: "Study group\nProject mentoring",
    });
    expect(result.responsibilities).toEqual(["Study group", "Project mentoring"]);
  });

  it("rejects an unknown roster role", () => {
    expect(wingRosterSchema.safeParse({ wingId: WING, memberId: WING, role: "BOSS" }).success).toBe(false);
  });
});

describe("committee and wing actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("denies a roleless actor before writing a committee member", async () => {
    a.requireActor.mockRejectedValue(new ForbiddenError());
    await expect(
      saveCommitteeMemberAction(
        fd([
          ["sessionId", WING],
          ["name", "Test"],
          ["title", "Lead"],
          ["order", "0"],
        ]),
      ),
    ).rejects.toThrow(ForbiddenError);
    expect(a.upsert).not.toHaveBeenCalled();
  });

  it("audits a committee member upsert inside the transaction", async () => {
    a.requireActor.mockResolvedValue({ id: "u1", role: "SUPER_ADMIN" });
    a.upsert.mockResolvedValue({ id: "c1" });
    await saveCommitteeMemberAction(
      fd([
        ["id", "cmwypjwbz0009sbfj0tu78g24"],
        ["sessionId", WING],
        ["name", "Test"],
        ["title", "Lead"],
        ["order", "0"],
      ]),
    );
    expect(a.upsert).toHaveBeenCalled();
    expect(a.writeAudit).toHaveBeenCalledWith(expect.objectContaining({ entity: "CommitteeMember" }), tx);
  });

  it("denies a wing lead editing another wing", async () => {
    a.requireActor.mockResolvedValue({ id: "u1", role: "WING_LEAD", wingId: WING });
    a.findUnique.mockResolvedValue({ id: "other-wing", name: "Other" });
    await expect(
      saveWingAction(
        fd([
          ["wingId", "cmwypjwbz0009sbfj0tu78g25"],
          ["name", "Other"],
          ["description", "Another wing description"],
          ["responsibilities", "Some duty"],
        ]),
      ),
    ).rejects.toThrow(ForbiddenError);
    expect(a.update).not.toHaveBeenCalled();
  });

  it("lets a wing lead edit their own wing and audits it", async () => {
    a.requireActor.mockResolvedValue({ id: "u1", role: "WING_LEAD", wingId: WING });
    a.findUnique.mockResolvedValue({ id: WING, name: "AI/ML" });
    a.update.mockResolvedValue({ id: WING });
    await saveWingAction(
      fd([
        ["wingId", WING],
        ["name", "AI/ML"],
        ["description", "Applied ML"],
        ["responsibilities", "Study group"],
      ]),
    );
    expect(a.update).toHaveBeenCalled();
    expect(a.writeAudit).toHaveBeenCalledWith(expect.objectContaining({ entity: "Wing" }), tx);
  });
});
