import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/backend/shared/rbac";

const e = vi.hoisted(() => ({
  requireActor: vi.fn(),
  writeAudit: vi.fn(),
  resourceUpsert: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/backend/shared/admin-guard", () => ({ requireActor: e.requireActor }));
vi.mock("@/backend/shared/audit", () => ({ writeAudit: e.writeAudit }));
vi.mock("@/backend/shared/db", () => ({
  db: { resource: { upsert: e.resourceUpsert }, $transaction: e.transaction },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));

import { resourceFilterSchema, resourceSchema } from "@/backend/shared/validators";
import { saveResourceAction } from "@/server/actions/resources";

const form = () => {
  const data = new FormData();
  data.set("type", "CP_SHEET");
  data.set("title", "DIU SEC CP sheet");
  data.set("url", "https://github.com/diu-sec/cp-sheet");
  data.set("tags", "cp\nbeginner");
  return data;
};

describe("resource validators", () => {
  it("splits tags and rejects an unknown resource type", () => {
    expect(resourceSchema.parse(Object.fromEntries(form())).tags).toEqual(["cp", "beginner"]);
    expect(resourceFilterSchema.safeParse({ type: "VIDEO" }).success).toBe(false);
  });
});

describe("resource action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.requireActor.mockResolvedValue({ id: "u1", role: "WING_LEAD", wingId: "w1" });
    e.resourceUpsert.mockResolvedValue({ id: "r1" });
    e.transaction.mockImplementation(async (callback) => callback({ resource: { upsert: e.resourceUpsert } }));
  });

  it("saves a resource and audits the create", async () => {
    await saveResourceAction(form());
    expect(e.resourceUpsert).toHaveBeenCalled();
    expect(e.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CREATE", entity: "Resource" }),
      expect.anything(),
    );
  });

  it("propagates an authorization denial without writing", async () => {
    e.requireActor.mockRejectedValueOnce(new ForbiddenError());
    await expect(saveResourceAction(form())).rejects.toThrow(ForbiddenError);
    expect(e.resourceUpsert).not.toHaveBeenCalled();
  });
});
