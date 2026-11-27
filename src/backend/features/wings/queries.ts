import { db } from "@/backend/shared/db";
import { getEligibleMembers } from "@/backend/features/membership/queries";

export function getPublicWings() {
  return db.wing.findMany({
    orderBy: { name: "asc" },
    include: {
      members: {
        include: { member: { select: { name: true } } },
        orderBy: { role: "asc" },
      },
    },
  });
}

export function getWingBySlug(slug: string) {
  return db.wing.findUnique({
    where: { slug },
    include: {
      members: {
        include: { member: { select: { name: true, batch: true, status: true } } },
        orderBy: [{ role: "asc" }, { member: { name: "asc" } }],
      },
    },
  });
}

export function getAdminWings(wingId?: string | null) {
  return Promise.all([
    db.wing.findMany({
      where: wingId ? { id: wingId } : {},
      orderBy: { name: "asc" },
      include: {
        members: { include: { member: { select: { name: true, batch: true, status: true } } } },
      },
    }),
    getEligibleMembers(wingId),
  ]);
}
