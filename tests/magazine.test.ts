import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { ForbiddenError } from "@/backend/shared/rbac";

const e = vi.hoisted(() => ({
  requireActor: vi.fn(),
  writeAudit: vi.fn(),
  issueUpsert: vi.fn(),
  articleUpdate: vi.fn(),
  transaction: vi.fn(),
  saveUpload: vi.fn(),
  removeAsset: vi.fn(),
}));
vi.mock("@/backend/shared/admin-guard", () => ({ requireActor: e.requireActor }));
vi.mock("@/backend/shared/audit", () => ({ writeAudit: e.writeAudit }));
vi.mock("@/backend/shared/db", () => ({
  db: {
    magazineIssue: { upsert: e.issueUpsert },
    article: { update: e.articleUpdate },
    $transaction: e.transaction,
  },
}));
vi.mock("@/backend/shared/storage", () => ({ saveUpload: e.saveUpload, removeUploadedAsset: e.removeAsset }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));

import { articleModerationSchema, magazineIssueSchema } from "@/backend/shared/validators";
import { moderateArticleAction, saveMagazineIssueAction } from "@/server/actions/magazine";

const fd = (entries: [string, string][]) => {
  const data = new FormData();
  for (const [key, value] of entries) data.set(key, value);
  return data;
};

describe("magazine validators", () => {
  it("requires a positive issue number and a published date when supplied", () => {
    expect(magazineIssueSchema.safeParse({ number: 0, title: "Issue", pdfUrl: "/uploads/x.pdf" }).success).toBe(false);
    expect(
      magazineIssueSchema.parse({
        number: "7",
        title: "Issue Seven",
        pdfUrl: "/uploads/x.pdf",
        publishedAt: "2026-11-20",
      }).publishedAt,
    ).toBeInstanceOf(Date);
  });

  it("accepts only article moderation decisions", () => {
    expect(articleModerationSchema.safeParse({ id: "a1", decision: "PUBLISH" }).success).toBe(false);
    expect(articleModerationSchema.parse({ id: "a1", decision: "APPROVE", issueId: "issue1" }).decision).toBe("APPROVE");
  });
});

describe("magazine actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.requireActor.mockResolvedValue({ id: "u1", role: "PUBLICATION_EDITOR" });
    e.issueUpsert.mockResolvedValue({ id: "issue1" });
    e.articleUpdate.mockResolvedValue({ id: "a1" });
    e.transaction.mockImplementation(async (callback) =>
      callback({ magazineIssue: { upsert: e.issueUpsert }, article: { update: e.articleUpdate } }),
    );
    e.saveUpload.mockResolvedValue("/uploads/issue.pdf");
    e.removeAsset.mockResolvedValue(undefined);
  });

  it("saves an uploaded issue PDF and audits the create", async () => {
    const data = fd([
      ["number", "7"],
      ["title", "Issue Seven"],
      ["featured", "on"],
    ]);
    data.set("pdf", new File(["pdf"], "issue.pdf", { type: "application/pdf" }));
    await saveMagazineIssueAction(data);
    expect(e.saveUpload).toHaveBeenCalledWith(expect.any(File), "pdf");
    expect(e.issueUpsert).toHaveBeenCalled();
    expect(e.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CREATE", entity: "MagazineIssue" }),
      expect.anything(),
    );
  });

  it("removes uploads when a duplicate issue number conflicts", async () => {
    e.saveUpload.mockResolvedValueOnce("/uploads/issue.pdf").mockResolvedValueOnce("/uploads/cover.png");
    e.transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "6.19.3" }),
    );
    const data = fd([
      ["number", "7"],
      ["title", "Issue Seven"],
    ]);
    data.set("pdf", new File(["pdf"], "issue.pdf", { type: "application/pdf" }));
    data.set("cover", new File(["png"], "cover.png", { type: "image/png" }));
    await expect(saveMagazineIssueAction(data)).rejects.toThrow(/number/i);
    expect(e.removeAsset).toHaveBeenCalledTimes(2);
  });

  it("requires an issue when approving an article", async () => {
    await expect(moderateArticleAction(fd([["id", "a1"], ["decision", "APPROVE"]]))).rejects.toThrow(/issue/i);
    expect(e.articleUpdate).not.toHaveBeenCalled();
  });

  it("approves an article and audits it", async () => {
    await moderateArticleAction(fd([["id", "a1"], ["decision", "APPROVE"], ["issueId", "issue1"]]));
    expect(e.articleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "APPROVED" }) }),
    );
    expect(e.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "APPROVE", entity: "Article" }),
      expect.anything(),
    );
  });

  it("propagates an authorization denial without writing", async () => {
    e.requireActor.mockRejectedValueOnce(new ForbiddenError());
    await expect(moderateArticleAction(fd([["id", "a1"], ["decision", "APPROVE"]]))).rejects.toThrow(ForbiddenError);
    expect(e.articleUpdate).not.toHaveBeenCalled();
  });
});
