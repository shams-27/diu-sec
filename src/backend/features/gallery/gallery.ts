"use server";

import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/backend/shared/admin-guard";
import { writeAudit } from "@/backend/shared/audit";
import { db } from "@/backend/shared/db";
import { removeUploadedAsset, saveUpload } from "@/backend/shared/storage";
import { galleryAlbumSchema, galleryPhotoSchema } from "@/backend/shared/validators";

export async function saveGalleryAlbumAction(formData: FormData): Promise<void> {
  const actor = await requireActor("gallery", "write");
  const input = galleryAlbumSchema.parse(Object.fromEntries(formData));
  const coverFile = formData.get("cover");
  const uploadedCover = coverFile instanceof File && coverFile.size > 0 ? await saveUpload(coverFile, "image") : null;
  const coverUrl = uploadedCover ?? input.coverUrl ?? null;
  const data = { title: input.title, category: input.category, coverUrl };
  try {
    await db.$transaction(
      async (tx) => {
        const saved = await tx.galleryAlbum.upsert({
          where: { id: input.id ?? randomUUID() },
          create: data,
          update: data,
        });
        await writeAudit(
          {
            actorId: actor.id,
            action: input.id ? "UPDATE" : "CREATE",
            entity: "GalleryAlbum",
            entityId: saved.id,
            after: data as Prisma.InputJsonValue,
          },
          tx,
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (uploadedCover) await removeUploadedAsset(uploadedCover);
    throw error;
  }
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function addGalleryPhotoAction(formData: FormData): Promise<void> {
  const actor = await requireActor("gallery", "write");
  const input = galleryPhotoSchema.parse(Object.fromEntries(formData));
  const album = await db.galleryAlbum.findUnique({ where: { id: input.albumId }, select: { id: true } });
  if (!album) throw new Error("Album not found");
  const photoFile = formData.get("photo");
  const uploadedPhoto = photoFile instanceof File && photoFile.size > 0 ? await saveUpload(photoFile, "image") : null;
  const url = uploadedPhoto ?? input.url;
  if (!url) throw new Error("A photo is required");
  const data = { albumId: input.albumId, url, caption: input.caption, order: input.order };
  try {
    await db.$transaction(
      async (tx) => {
        const saved = await tx.galleryPhoto.create({ data });
        await writeAudit(
          {
            actorId: actor.id,
            action: "CREATE",
            entity: "GalleryPhoto",
            entityId: saved.id,
            after: data as Prisma.InputJsonValue,
          },
          tx,
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (uploadedPhoto) await removeUploadedAsset(uploadedPhoto);
    throw error;
  }
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}
