import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/backend/shared/db";
import { HOME_HIGHLIGHTS_TAG } from "@/backend/shared/cache-tags";

export async function getHomeHighlights() {
  "use cache";
  cacheLife("minutes");
  cacheTag(HOME_HIGHLIGHTS_TAG);
  const [upcoming, wings] = await Promise.all([
    db.event.findMany({
      where: { status: "PUBLISHED", startsAt: { gte: new Date() } },
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
  ]);
  return { upcoming, wings };
}
