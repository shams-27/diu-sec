import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PageHero, SectionTitle } from "@/frontend/shared/page-hero";
import { db } from "@/backend/shared/db";

export const metadata: Metadata = { title: "Magazine issue" };

export default async function MagazineIssuePage({ params }: { params: Promise<{ issueId: string }> }) {
  await connection();
  const { issueId } = await params;
  const issue = await db.magazineIssue.findFirst({
    where: { id: issueId, publishedAt: { not: null } },
    include: {
      articles: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!issue) notFound();

  return (
    <div className="space-y-8">
      <PageHero eyebrow={`Issue ${issue.number}`} title={issue.title}>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={issue.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download aria-hidden="true" className="size-4" />
            Download issue PDF
          </a>
          {issue.publishedAt ? (
            <p className="text-sm font-medium text-primary tabular-nums">
              Published {issue.publishedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
            </p>
          ) : null}
        </div>
      </PageHero>

      <section aria-labelledby="articles-heading" className="space-y-5">
        <SectionTitle id="articles-heading">In this issue</SectionTitle>
        {issue.articles.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Articles for this issue are being prepared. You can still download the full PDF above.
          </p>
        ) : (
          <ul className="space-y-5">
            {issue.articles.map((article) => (
              <li key={article.id} className="card-lift rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="font-heading text-2xl tracking-wide">{article.title}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">{article.authorName}</p>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  {article.body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => (
                    <p key={index} className="whitespace-pre-wrap">{paragraph}</p>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href="/magazine"
        className="inline-block rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        ← All issues
      </Link>
    </div>
  );
}
