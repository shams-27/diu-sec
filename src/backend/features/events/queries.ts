import { db } from "@/backend/shared/db";
import { getWingOptions } from "@/backend/features/membership/queries";

export function getPublishedEvents(tab: "upcoming" | "past", now: Date) {
  return db.event.findMany({
    where: { status: "PUBLISHED", startsAt: tab === "past" ? { lt: now } : { gte: now } },
    orderBy: { startsAt: tab === "past" ? "desc" : "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      description: true,
      startsAt: true,
      endsAt: true,
      capacity: true,
      seatsTaken: true,
      wing: { select: { name: true } },
    },
  });
}

export function getPublishedEventBySlug(slug: string) {
  return db.event.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      type: true,
      description: true,
      startsAt: true,
      endsAt: true,
      capacity: true,
      seatsTaken: true,
      syllabus: true,
      wing: { select: { name: true } },
    },
  });
}

export function getAdminEvents(wingId?: string | null) {
  return Promise.all([
    db.event.findMany({
      where: wingId ? { wingId } : {},
      orderBy: { startsAt: "desc" },
      include: { wing: { select: { name: true } }, _count: { select: { registrations: true } } },
    }),
    wingId ? Promise.resolve([]) : getWingOptions(),
  ]);
}

export function getAdminEventById(id: string, wingId?: string | null) {
  return db.event.findFirst({
    where: { id, ...(wingId ? { wingId } : {}) },
    include: {
      registrations: { orderBy: { createdAt: "desc" } },
      wing: { select: { name: true } },
    },
  });
}

export function getCheckinEvent(id: string, wingId?: string | null) {
  return db.event.findFirst({
    where: { id, ...(wingId ? { wingId } : {}) },
    select: { id: true, title: true },
  });
}
