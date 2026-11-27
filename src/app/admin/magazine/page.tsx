import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { connection } from "next/server";
import { requireActor } from "@/backend/shared/admin-guard";
import { db } from "@/backend/shared/db";
import { moderateArticleAction, saveMagazineIssueAction } from "@/server/actions/magazine";

export const metadata: Metadata = { title: "Magazine · Admin" };

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const buttonClass =
  "rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primaryButtonClass =
  "w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const local = (date: Date | null) => (date ? date.toISOString().slice(0, 16) : "");

export default async function MagazineAdminPage() {
  await connection();
  await requireActor("magazine", "read");
  const [issues, articles] = await Promise.all([
    db.magazineIssue.findMany({
      orderBy: { number: "desc" },
      include: { _count: { select: { articles: true } } },
    }),
    db.article.findMany({
      where: { status: "SUBMITTED" },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, body: true, authorName: true, issueId: true, createdAt: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">A-07</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide">Magazine CMS</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Publish issue PDFs and review student articles before they go live.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 card-lift sm:p-5">
        <h2 className="font-heading text-2xl tracking-wide">New issue</h2>
        <form action={saveMagazineIssueAction} encType="multipart/form-data" className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">
            Issue number
            <input name="number" type="number" min={1} max={999} required className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Title
            <input name="title" required minLength={2} maxLength={150} className={inputClass} />
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            Issue PDF
            <input name="pdf" type="file" accept="application/pdf" required className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Cover image (optional)
            <input name="cover" type="file" accept="image/jpeg,image/png,image/webp" className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Published at (UTC, optional)
            <input name="publishedAt" type="datetime-local" className={inputClass} />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium">
            <input name="featured" type="checkbox" className="h-4 w-4 rounded border-border" />
            Feature this issue
          </label>
          <button type="submit" className={`${primaryButtonClass} sm:col-span-2`}>Create issue</button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-heading text-2xl tracking-wide">
          <BookOpen aria-hidden className="h-5 w-5 text-primary" />
          Issues
        </h2>
        {issues.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No magazine issues yet. Add the first one above.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {issues.map((issue) => (
              <article key={issue.id} className="rounded-2xl border border-border bg-card p-4 card-lift sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-heading text-2xl tracking-wide">Issue {issue.number}</h3>
                    <p className="break-words text-sm text-muted-foreground">{issue.title}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="pill">{issue.publishedAt ? "Published" : "Draft"}</span>
                    {issue.featured ? <span className="pill">Featured</span> : null}
                  </div>
                </div>
                <p className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <a href={issue.pdfUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Download PDF
                  </a>
                  <span>{issue._count.articles} articles</span>
                  {issue.publishedAt ? (
                    <span className="tabular-nums">{issue.publishedAt.toLocaleDateString("en-GB", { timeZone: "UTC" })}</span>
                  ) : null}
                </p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Edit issue
                  </summary>
                  <form action={saveMagazineIssueAction} className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="id" value={issue.id} />
                    <input type="hidden" name="pdfUrl" value={issue.pdfUrl} />
                    {issue.coverUrl ? <input type="hidden" name="coverUrl" value={issue.coverUrl} /> : null}
                    <label className="text-xs font-medium">
                      Issue number
                      <input name="number" type="number" min={1} max={999} defaultValue={issue.number} required className={inputClass} />
                    </label>
                    <label className="text-xs font-medium">
                      Title
                      <input name="title" defaultValue={issue.title} required className={inputClass} />
                    </label>
                    <label className="text-xs font-medium sm:col-span-2">
                      Published at (UTC)
                      <input name="publishedAt" type="datetime-local" defaultValue={local(issue.publishedAt)} className={inputClass} />
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium">
                      <input name="featured" type="checkbox" defaultChecked={issue.featured} className="h-4 w-4 rounded border-border" />
                      Feature this issue
                    </label>
                    <p className="text-xs text-muted-foreground sm:col-span-2">The current PDF and cover are kept when you save.</p>
                    <button type="submit" className={`${buttonClass} sm:col-span-2`}>Save issue</button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl tracking-wide">Articles awaiting review</h2>
        {articles.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No submitted articles right now.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wide">
                <tr>
                  <th scope="col" className="px-3 py-2">Article</th>
                  <th scope="col" className="px-3 py-2">Author</th>
                  <th scope="col" className="px-3 py-2">Submitted</th>
                  <th scope="col" className="px-3 py-2">Decision</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="border-t border-border align-top">
                    <td className="max-w-[320px] px-3 py-2">
                      <span className="pill">Submitted</span>
                      <p className="mt-2 font-medium">{article.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{article.body}</p>
                    </td>
                    <td className="px-3 py-2">{article.authorName}</td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted-foreground">
                      {article.createdAt.toLocaleDateString("en-GB", { timeZone: "UTC" })}
                    </td>
                    <td className="px-3 py-2">
                      <form action={moderateArticleAction} className="min-w-[220px] space-y-2">
                        <input type="hidden" name="id" value={article.id} />
                        <label className="block text-xs font-medium">
                          Assign to issue
                          <select name="issueId" defaultValue={article.issueId ?? ""} required className={inputClass}>
                            <option value="">No issue</option>
                            {issues.map((issue) => (
                              <option key={issue.id} value={issue.id}>Issue {issue.number} · {issue.title}</option>
                            ))}
                          </select>
                        </label>
                        <details>
                          <summary className="cursor-pointer text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            Edit before deciding
                          </summary>
                          <div className="mt-2 space-y-2">
                            <label className="block text-xs font-medium">
                              Title
                              <input name="title" defaultValue={article.title} className={inputClass} />
                            </label>
                            <label className="block text-xs font-medium">
                              Body
                              <textarea name="body" defaultValue={article.body} rows={3} className={inputClass} />
                            </label>
                          </div>
                        </details>
                        <div className="flex flex-wrap gap-2">
                          <button type="submit" name="decision" value="APPROVE" className={primaryButtonClass}>Approve</button>
                          <button type="submit" name="decision" value="REJECT" className={buttonClass}>Reject</button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
