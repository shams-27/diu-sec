import type { NoticeCategory } from "@prisma/client";
import { db } from "@/backend/shared/db";

export function getPublicNotices(category?: NoticeCategory) {
  const now = new Date();
  return db.notice.findMany({
    where: {
      publishAt: { lte: now },
      OR: [{ expireAt: null }, { expireAt: { gt: now } }],
      ...(category ? { category } : {}),
    },
    orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
    select: {
      id: true,
      title: true,
      body: true,
      category: true,
      pinned: true,
      publishAt: true,
    },
  });
}

export function getAllNotices() {
  return db.notice.findMany({ orderBy: [{ pinned: "desc" }, { publishAt: "desc" }] });
}
