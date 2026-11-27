import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { connection } from "next/server";
import { PageHero, SectionTitle } from "@/components/public/page-hero";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Magazine",
  description: "Issues and student articles from the DIU SEC magazine.",
};

export default async function MagazinePage() {
  await connection();
  const issues = await db.magazineIssue.findMany({
    where: { publishedAt: { not: null } },
    orderBy: [{ featured: "desc" }, { number: "desc" }],
    select: {
      id: true,
      number: true,
      title: true,
      coverUrl: true,
      featured: true,
      publishedAt: true,
    },
  });

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Publications"
        title="DIU SEC magazine"
        description="Every issue, from first draft to flagship release — written, edited and designed by club members."
      />

      <section aria-labelledby="issues-heading" className="space-y-5">
        <SectionTitle id="issues-heading">All issues</SectionTitle>
        {issues.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No magazine issues have been published yet. Check back soon.
          </p>
        ) : (
          <ul className="stagger-in grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map((issue) => (
              <li key={issue.id} className="card-lift overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {issue.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={issue.coverUrl}
                    alt=""
                    className="h-44 w-full border-b border-border object-cover"
                  />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center border-b border-border bg-muted" aria-hidden="true">
                    <BookOpen className="size-10 text-primary" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="pill">Issue {issue.number}</span>
                    {issue.featured ? <span className="pill border-primary/40 text-primary">Featured</span> : null}
                  </div>
                  <h3 className="mt-4 font-heading text-2xl leading-tight tracking-wide">{issue.title}</h3>
                  {issue.publishedAt ? (
                    <p className="mt-2 text-xs font-medium text-primary tabular-nums">
                      {issue.publishedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                    </p>
                  ) : null}
                  <Link
                    href={`/magazine/${issue.id}`}
                    className="mt-5 inline-block rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Read this issue →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
