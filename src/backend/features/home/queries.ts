import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/backend/shared/db";
import { HOME_HIGHLIGHTS_TAG } from "@/backend/shared/cache-tags";

export async function getHomeHighlights() {
  "use cache";
  cacheLife("minutes");
  cacheTag(HOME_HIGHLIGHTS_TAG);
  const now = new Date();
  const [upcoming, wings, nextEvent] = await Promise.all([
    db.event.findMany({
      where: { status: "PUBLISHED", startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 3,
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        startsAt: true,
        capacity: true,
        seatsTaken: true,
      },
    }),
    db.wing.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true, description: true },
    }),
    db.event.findFirst({
      where: { status: "PUBLISHED", endsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 1,
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        startsAt: true,
        endsAt: true,
        capacity: true,
        seatsTaken: true,
      },
    }),
  ]);
  return { upcoming, wings, nextEvent, nowIso: now.toISOString() };
}
