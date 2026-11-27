import type { AlbumCategory } from "@prisma/client";
import { db } from "@/backend/shared/db";

export function getPublicAlbums(category?: AlbumCategory) {
  return db.galleryAlbum.findMany({
    where: category ? { category } : {},
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      category: true,
      coverUrl: true,
      photos: { orderBy: { order: "asc" }, select: { id: true, url: true, caption: true } },
    },
  });
}

export function getAdminAlbums() {
  return db.galleryAlbum.findMany({
    orderBy: { createdAt: "desc" },
    include: { photos: { orderBy: { order: "asc" } } },
  });
}
