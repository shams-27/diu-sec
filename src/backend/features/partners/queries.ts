import { db } from "@/backend/shared/db";

export function getSponsors() {
  return db.sponsor.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, kind: true, name: true, logoUrl: true, websiteUrl: true, tier: true, bio: true },
  });
}

export function getAllSponsors() {
  return db.sponsor.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
}
