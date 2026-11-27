import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { db } from "@/lib/db";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const PAGES = [
  "",
  "/committee",
  "/wings",
  "/join",
  "/events",
  "/magazine",
  "/hall-of-fame",
  "/projects",
  "/verify",
  "/notices",
  "/resources",
  "/partners",
  "/gallery",
  "/faq",
  "/contact",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [events, wings, issues] = await Promise.all([
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

  return [
    ...PAGES.map((path) => ({ url: `${SITE}${path}`, changeFrequency: "weekly" as const, priority: path ? 0.6 : 1 })),
    ...events.map((event) => ({
      url: `${SITE}/events/${event.slug}`,
      lastModified: event.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...wings.map((wing) => ({
      url: `${SITE}/wings/${wing.slug}`,
      lastModified: wing.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...issues.map((issue) => ({
      url: `${SITE}/magazine/${issue.id}`,
      lastModified: issue.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
