import type { ResourceType } from "@prisma/client";
import { db } from "@/backend/shared/db";

export function getResources(type?: ResourceType) {
  return db.resource.findMany({
    where: type ? { type } : {},
    orderBy: [{ type: "asc" }, { title: "asc" }],
    select: { id: true, type: true, title: true, url: true, tags: true },
  });
}

export function getAllResources() {
  return db.resource.findMany({ orderBy: [{ type: "asc" }, { title: "asc" }] });
}
