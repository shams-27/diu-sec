import type { HofCategory } from "@prisma/client";
import { db } from "@/backend/shared/db";

export function getVerifiedEntries(category?: HofCategory) {
  return db.hallOfFameEntry.findMany({
    where: { verified: true, ...(category ? { category } : {}) },
    orderBy: [{ year: "desc" }, { personName: "asc" }],
    select: {
      id: true,
      category: true,
      title: true,
      personName: true,
      year: true,
      description: true,
      imageUrl: true,
    },
  });
}

export function getAllEntries() {
  return db.hallOfFameEntry.findMany({ orderBy: [{ year: "desc" }, { title: "asc" }] });
}
