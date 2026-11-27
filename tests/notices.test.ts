import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/rbac";

const e = vi.hoisted(() => ({
  requireActor: vi.fn(),
  writeAudit: vi.fn(),
  noticeUpsert: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/admin-guard", () => ({ requireActor: e.requireActor }));
vi.mock("@/lib/audit", () => ({ writeAudit: e.writeAudit }));
vi.mock("@/lib/db", () => ({ db: { notice: { upsert: e.noticeUpsert }, $transaction: e.transaction } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));

import { noticeSchema } from "@/lib/validators";
import { saveNoticeAction } from "@/server/actions/notices";

const form = () => {
  const data = new FormData();
  data.set("title", "Contest schedule");
  data.set("body", "The spring contest starts on Friday.");
  data.set("category", "CONTEST");
  data.set("publishAt", "2026-11-28T09:00");
  data.set("expireAt", "2026-12-28T09:00");
  data.set("pinned", "on");
  return data;
};

describe("notice validators", () => {
  it("parses pinned and datetime fields and rejects expiry before publish", () => {
    const parsed = noticeSchema.parse(Object.fromEntries(form()));
    expect(parsed.pinned).toBe(true);
    expect(parsed.publishAt).toBeInstanceOf(Date);
    expect(
      noticeSchema.safeParse({
        ...Object.fromEntries(form()),
        publishAt: "2026-12-28T09:00",
        expireAt: "2026-11-28T09:00",
      }).success,
    ).toBe(false);
  });
});

describe("notice actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.requireActor.mockResolvedValue({ id: "u1", role: "PUBLICATION_EDITOR" });
    e.noticeUpsert.mockResolvedValue({ id: "n1" });
    e.transaction.mockImplementation(async (callback) => callback({ notice: { upsert: e.noticeUpsert } }));
  });

  it("saves a scheduled notice and audits the create", async () => {
    await saveNoticeAction(form());
    expect(e.noticeUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ pinned: true }) }),
    );
    expect(e.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CREATE", entity: "Notice" }),
      expect.anything(),
    );
  });

  it("propagates an authorization denial without writing", async () => {
    e.requireActor.mockRejectedValueOnce(new ForbiddenError());
    await expect(saveNoticeAction(form())).rejects.toThrow(ForbiddenError);
    expect(e.noticeUpsert).not.toHaveBeenCalled();
  });
});
