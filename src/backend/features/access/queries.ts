import { db } from "@/backend/shared/db";

export function getAccessData() {
  return Promise.all([
    db.user.findMany({ include: { wing: true }, orderBy: { email: "asc" } }),
    db.wing.findMany({ orderBy: { name: "asc" } }),
  ]);
}
