import { db } from "@/backend/shared/db";

export function getPublicSessions() {
  return db.execSession.findMany({ orderBy: { year: "desc" } });
}

export function getAdminSessions() {
  return db.execSession.findMany({
    orderBy: { year: "desc" },
    include: { _count: { select: { members: true } } },
  });
}

export function getSessionMembers(sessionId: string) {
  return db.committeeMember.findMany({ where: { sessionId }, orderBy: { order: "asc" } });
}
