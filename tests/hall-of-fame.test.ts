import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/rbac";

const e = vi.hoisted(() => ({
  requireActor: vi.fn(),
  writeAudit: vi.fn(),
  entryUpsert: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/admin-guard", () => ({ requireActor: e.requireActor }));
vi.mock("@/lib/audit", () => ({ writeAudit: e.writeAudit }));
vi.mock("@/lib/db", () => ({
  db: { hallOfFameEntry: { upsert: e.entryUpsert }, $transaction: e.transaction },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));

import { hallOfFameSchema } from "@/lib/validators";
import { saveHallOfFameEntryAction } from "@/server/actions/hall-of-fame";

const form = () => {
  const data = new FormData();
  data.set("category", "ICPC");
  data.set("title", "ICPC regional finalists");
  data.set("personName", "Jane Doe");
  data.set("year", "2026");
  data.set("description", "Qualified for the regional finals.");
  data.set("verified", "on");
  return data;
};

describe("hall of fame validators", () => {
  it("rejects an unknown category and a future year", () => {
    const base = Object.fromEntries(form());
    expect(hallOfFameSchema.safeParse({ ...base, category: "SPORTS" }).success).toBe(false);
    expect(hallOfFameSchema.safeParse({ ...base, year: "2200" }).success).toBe(false);
  });
});

describe("hall of fame actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.requireActor.mockResolvedValue({ id: "u1", role: "PUBLICATION_EDITOR" });
    e.entryUpsert.mockResolvedValue({ id: "h1" });
    e.transaction.mockImplementation(async (callback) => callback({ hallOfFameEntry: { upsert: e.entryUpsert } }));
  });

  it("saves a verified entry and audits the create", async () => {
    await saveHallOfFameEntryAction(form());
    expect(e.entryUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ verified: true }) }),
    );
    expect(e.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CREATE", entity: "HallOfFameEntry" }),
      expect.anything(),
    );
  });

  it("propagates an authorization denial without writing", async () => {
    e.requireActor.mockRejectedValueOnce(new ForbiddenError());
    await expect(saveHallOfFameEntryAction(form())).rejects.toThrow(ForbiddenError);
    expect(e.entryUpsert).not.toHaveBeenCalled();
  });
});
