import { db } from "@/backend/shared/db";

export function getSitemapData() {
  return Promise.all([
    db.event.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    db.wing.findMany({ select: { slug: true, updatedAt: true } }),
    db.magazineIssue.findMany({
      where: { publishedAt: { not: null } },
      select: { id: true, updatedAt: true },
    }),
  ]);
}
