import type { Metadata } from "next";
import Link from "next/link";
import { Pin } from "lucide-react";
import { connection } from "next/server";
import { PageHero, SectionTitle } from "@/components/public/page-hero";
import { db } from "@/lib/db";
import { NOTICE_CATEGORIES, noticeFilterSchema } from "@/lib/validators";

export const metadata: Metadata = {
  title: "Notices",
  description: "Recruitment, committee, contest and campus notices from DIU SEC.",
};

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? (value[0] ?? "") : (value ?? "")]),
  );
  const parsed = noticeFilterSchema.safeParse(flat);
  const category = parsed.success ? parsed.data.category : undefined;
  const now = new Date();
  const notices = await db.notice.findMany({
    where: {
      publishAt: { lte: now },
      OR: [{ expireAt: null }, { expireAt: { gt: now } }],
      ...(category ? { category } : {}),
    },
    orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
    select: {
      id: true,
      title: true,
      body: true,
      category: true,
      pinned: true,
      publishAt: true,
    },
  });

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Stay informed"
        title="Notices"
        description="Recruitment drives, committee updates, contests and campus announcements — newest first."
      />

      <nav aria-label="Notice categories" className="flex flex-wrap gap-2">
        <Link
          href="/notices"
          aria-current={category === undefined ? "page" : undefined}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            category === undefined ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
          }`}
        >
          All
        </Link>
        {NOTICE_CATEGORIES.map((value) => (
          <Link
            key={value}
            href={`/notices?category=${value}`}
            aria-current={category === value ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              category === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
            }`}
          >
            {value}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="notices-heading" className="space-y-5">
        <SectionTitle id="notices-heading">{category ? `${category} notices` : "Latest notices"}</SectionTitle>
        {notices.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            There are no active notices in this category. Check back soon.
          </p>
        ) : (
          <ul className="space-y-4">
            {notices.map((notice) => (
              <li key={notice.id} className="card-lift rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill">{notice.category}</span>
                  {notice.pinned ? (
                    <span className="pill border-primary/40 text-primary">
                      <Pin aria-hidden="true" className="mr-1 size-3" />
                      Pinned
                    </span>
                  ) : null}
                  <time
                    dateTime={notice.publishAt.toISOString()}
                    className="text-xs font-medium text-primary tabular-nums"
                  >
                    {notice.publishAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                  </time>
                </div>
                <h3 className="mt-3 font-heading text-2xl leading-tight tracking-wide">{notice.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{notice.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
