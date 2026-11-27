import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/backend/shared/rbac";

const e = vi.hoisted(() => ({
  requireActor: vi.fn(),
  writeAudit: vi.fn(),
  sponsorUpsert: vi.fn(),
  transaction: vi.fn(),
  saveUpload: vi.fn(),
  removeAsset: vi.fn(),
}));
vi.mock("@/backend/shared/admin-guard", () => ({ requireActor: e.requireActor }));
vi.mock("@/backend/shared/audit", () => ({ writeAudit: e.writeAudit }));
vi.mock("@/backend/shared/db", () => ({
  db: { sponsor: { upsert: e.sponsorUpsert }, $transaction: e.transaction },
}));
vi.mock("@/backend/shared/storage", () => ({ saveUpload: e.saveUpload, removeUploadedAsset: e.removeAsset }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));

import { sponsorSchema } from "@/backend/shared/validators";
import { saveSponsorAction } from "@/backend/features/partners/sponsors";

const form = () => {
  const data = new FormData();
  data.set("kind", "FACULTY_ADVISOR");
  data.set("name", "Dr. Advisor");
  data.set("websiteUrl", "https://swe.diu.edu.bd");
  data.set("tier", "Advisor");
  data.set("bio", "Faculty advisor for the club.");
  data.set("order", "2");
  return data;
};

describe("sponsor validators", () => {
  it("rejects an unknown kind and parses order", () => {
    expect(sponsorSchema.parse(Object.fromEntries(form())).order).toBe(2);
    expect(sponsorSchema.safeParse({ ...Object.fromEntries(form()), kind: "CLUB" }).success).toBe(false);
  });
});

describe("sponsor action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.requireActor.mockResolvedValue({ id: "u1", role: "SUPER_ADMIN" });
    e.sponsorUpsert.mockResolvedValue({ id: "s1" });
    e.saveUpload.mockResolvedValue("/uploads/new-logo.png");
    e.removeAsset.mockResolvedValue(undefined);
    e.transaction.mockImplementation(async (callback) => callback({ sponsor: { upsert: e.sponsorUpsert } }));
  });

  it("saves a sponsor and audits the create", async () => {
    await saveSponsorAction(form());
    expect(e.sponsorUpsert).toHaveBeenCalled();
    expect(e.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CREATE", entity: "Sponsor" }),
      expect.anything(),
    );
  });

  it("prefers a replacement logo over the hidden existing URL", async () => {
    const data = form();
    data.set("id", "s1");
    data.set("logoUrl", "/uploads/old-logo.png");
    data.set("logo", new File(["png"], "logo.png", { type: "image/png" }));
    await saveSponsorAction(data);
    expect(e.saveUpload).toHaveBeenCalledWith(expect.any(File), "image");
    expect(e.sponsorUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ logoUrl: "/uploads/new-logo.png" }),
        update: expect.objectContaining({ logoUrl: "/uploads/new-logo.png" }),
      }),
    );
  });

  it("keeps the existing logo when the database write fails", async () => {
    const data = form();
    data.set("logoUrl", "/uploads/old-logo.png");
    e.transaction.mockRejectedValueOnce(new Error("db down"));
    await expect(saveSponsorAction(data)).rejects.toThrow("db down");
    expect(e.removeAsset).not.toHaveBeenCalledWith("/uploads/old-logo.png");
  });

  it("propagates an authorization denial without writing", async () => {
    e.requireActor.mockRejectedValueOnce(new ForbiddenError());
    await expect(saveSponsorAction(form())).rejects.toThrow(ForbiddenError);
    expect(e.sponsorUpsert).not.toHaveBeenCalled();
  });
});
