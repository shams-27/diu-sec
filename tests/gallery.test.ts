import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/backend/shared/rbac";

const e = vi.hoisted(() => ({
  requireActor: vi.fn(),
  writeAudit: vi.fn(),
  albumUpsert: vi.fn(),
  albumFind: vi.fn(),
  photoCreate: vi.fn(),
  transaction: vi.fn(),
  saveUpload: vi.fn(),
  removeAsset: vi.fn(),
}));
vi.mock("@/backend/shared/admin-guard", () => ({ requireActor: e.requireActor }));
vi.mock("@/backend/shared/audit", () => ({ writeAudit: e.writeAudit }));
vi.mock("@/backend/shared/db", () => ({
  db: {
    galleryAlbum: { upsert: e.albumUpsert, findUnique: e.albumFind },
    galleryPhoto: { create: e.photoCreate },
    $transaction: e.transaction,
  },
}));
vi.mock("@/backend/shared/storage", () => ({ saveUpload: e.saveUpload, removeUploadedAsset: e.removeAsset }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));

import { galleryAlbumSchema, galleryFilterSchema, galleryPhotoSchema } from "@/backend/shared/validators";
import { addGalleryPhotoAction, saveGalleryAlbumAction } from "@/server/actions/gallery";

describe("gallery validators", () => {
  it("accepts album categories and photo ordering", () => {
    expect(galleryAlbumSchema.parse({ title: "Freshers", category: "ORIENTATION" }).category).toBe("ORIENTATION");
    expect(galleryFilterSchema.safeParse({ category: "SPORTS" }).success).toBe(false);
    expect(galleryPhotoSchema.parse({ albumId: "a1", url: "/uploads/p.png", order: "3" }).order).toBe(3);
  });
});

describe("gallery actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.requireActor.mockResolvedValue({ id: "u1", role: "PUBLICATION_EDITOR" });
    e.albumUpsert.mockResolvedValue({ id: "a1" });
    e.albumFind.mockResolvedValue({ id: "a1" });
    e.photoCreate.mockResolvedValue({ id: "p1" });
    e.saveUpload.mockResolvedValue("/uploads/photo.png");
    e.removeAsset.mockResolvedValue(undefined);
    e.transaction.mockImplementation(async (callback) =>
      callback({ galleryAlbum: { upsert: e.albumUpsert }, galleryPhoto: { create: e.photoCreate } }),
    );
  });

  it("saves an album with an uploaded cover and audits it", async () => {
    const data = new FormData();
    data.set("title", "Freshers");
    data.set("category", "ORIENTATION");
    data.set("cover", new File(["png"], "cover.png", { type: "image/png" }));
    await saveGalleryAlbumAction(data);
    expect(e.saveUpload).toHaveBeenCalledWith(expect.any(File), "image");
    expect(e.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CREATE", entity: "GalleryAlbum" }),
      expect.anything(),
    );
  });

  it("prefers a replacement cover over the hidden existing URL", async () => {
    const data = new FormData();
    data.set("id", "a1");
    data.set("title", "Freshers");
    data.set("category", "ORIENTATION");
    data.set("coverUrl", "/uploads/old-cover.png");
    data.set("cover", new File(["png"], "cover.png", { type: "image/png" }));
    await saveGalleryAlbumAction(data);
    expect(e.saveUpload).toHaveBeenCalledWith(expect.any(File), "image");
    expect(e.albumUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ coverUrl: "/uploads/photo.png" }),
        update: expect.objectContaining({ coverUrl: "/uploads/photo.png" }),
      }),
    );
  });

  it("keeps the existing cover when the database write fails", async () => {
    const data = new FormData();
    data.set("id", "a1");
    data.set("title", "Freshers");
    data.set("category", "ORIENTATION");
    data.set("coverUrl", "/uploads/old-cover.png");
    e.transaction.mockRejectedValueOnce(new Error("db down"));
    await expect(saveGalleryAlbumAction(data)).rejects.toThrow("db down");
    expect(e.removeAsset).not.toHaveBeenCalledWith("/uploads/old-cover.png");
  });

  it("rolls back only a newly uploaded photo on a database failure", async () => {
    const data = new FormData();
    data.set("albumId", "a1");
    data.set("url", "/uploads/existing.png");
    data.set("photo", new File(["png"], "photo.png", { type: "image/png" }));
    e.transaction.mockRejectedValueOnce(new Error("db down"));
    await expect(addGalleryPhotoAction(data)).rejects.toThrow("db down");
    expect(e.saveUpload).toHaveBeenCalledWith(expect.any(File), "image");
    expect(e.removeAsset).toHaveBeenCalledWith("/uploads/photo.png");
    expect(e.removeAsset).not.toHaveBeenCalledWith("/uploads/existing.png");
  });

  it("adds a photo to an existing album and audits it", async () => {
    const data = new FormData();
    data.set("albumId", "a1");
    data.set("caption", "Opening ceremony");
    data.set("order", "1");
    data.set("photo", new File(["png"], "photo.png", { type: "image/png" }));
    await addGalleryPhotoAction(data);
    expect(e.photoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ url: "/uploads/photo.png", albumId: "a1" }) }),
    );
    expect(e.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CREATE", entity: "GalleryPhoto" }),
      expect.anything(),
    );
  });

  it("propagates an authorization denial without writing", async () => {
    e.requireActor.mockRejectedValueOnce(new ForbiddenError());
    await expect(saveGalleryAlbumAction(new FormData())).rejects.toThrow(ForbiddenError);
    expect(e.albumUpsert).not.toHaveBeenCalled();
  });
});
