import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { connection } from "next/server";
import { requireActor } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { NOTICE_CATEGORIES } from "@/lib/validators";
import { saveNoticeAction } from "@/server/actions/notices";

export const metadata: Metadata = { title: "Notice board · Admin" };

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const buttonClass =
  "rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primaryButtonClass =
  "w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const local = (date: Date) => date.toISOString().slice(0, 16);
const status = (notice: { publishAt: Date; expireAt: Date | null }, now: Date) =>
  notice.publishAt.getTime() > now.getTime()
    ? "Scheduled"
    : notice.expireAt && notice.expireAt.getTime() <= now.getTime()
      ? "Expired"
      : "Live";

export default async function NoticesAdminPage() {
  await connection();
  await requireActor("notices", "read");
  const notices = await db.notice.findMany({ orderBy: [{ pinned: "desc" }, { publishAt: "desc" }] });
  const now = new Date();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">A-10</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide">Notice board</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Publish, pin, schedule and expire club announcements.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 card-lift sm:p-5">
        <h2 className="font-heading text-2xl tracking-wide">New notice</h2>
        <form action={saveNoticeAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">
            Title
            <input name="title" required minLength={3} maxLength={150} className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Category
            <select name="category" defaultValue="CAMPUS" className={inputClass}>
              {NOTICE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            Body
            <textarea name="body" required minLength={10} maxLength={3000} rows={3} className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Publish at (UTC)
            <input name="publishAt" type="datetime-local" required defaultValue={local(now)} className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Expire at (UTC, optional)
            <input name="expireAt" type="datetime-local" className={inputClass} />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium">
            <input name="pinned" type="checkbox" className="h-4 w-4 rounded border-border" />
            Pin to top
          </label>
          <button type="submit" className={`${primaryButtonClass} sm:col-span-2`}>Publish notice</button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-heading text-2xl tracking-wide">
          <Bell aria-hidden className="h-5 w-5 text-primary" />
          All notices
        </h2>
        {notices.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No notices yet. Publish the first one above.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wide">
                <tr>
                  <th scope="col" className="px-3 py-2">Notice</th>
                  <th scope="col" className="px-3 py-2">Category</th>
                  <th scope="col" className="px-3 py-2">Status</th>
                  <th scope="col" className="px-3 py-2">Schedule</th>
                  <th scope="col" className="px-3 py-2">Edit</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((notice) => (
                  <tr key={notice.id} className="border-t border-border align-top">
                    <td className="max-w-[300px] px-3 py-2">
                      <p className="font-medium">{notice.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notice.body}</p>
                      {notice.pinned ? <span className="pill mt-2">Pinned</span> : null}
                    </td>
                    <td className="px-3 py-2"><span className="pill">{notice.category}</span></td>
                    <td className="px-3 py-2"><span className="pill">{status(notice, now)}</span></td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs tabular-nums text-muted-foreground">
                      <span className="block">From {local(notice.publishAt).replace("T", " ")}</span>
                      {notice.expireAt ? <span className="block">To {local(notice.expireAt).replace("T", " ")}</span> : null}
                    </td>
                    <td className="min-w-[300px] px-3 py-2">
                      <details>
                        <summary className="cursor-pointer text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          Edit notice
                        </summary>
                        <form action={saveNoticeAction} className="mt-3 grid gap-2 sm:grid-cols-2">
                          <input type="hidden" name="id" value={notice.id} />
                          <label className="text-xs font-medium">
                            Title
                            <input name="title" defaultValue={notice.title} required className={inputClass} />
                          </label>
                          <label className="text-xs font-medium">
                            Category
                            <select name="category" defaultValue={notice.category} className={inputClass}>
                              {NOTICE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                          </label>
                          <label className="text-xs font-medium sm:col-span-2">
                            Body
                            <textarea name="body" defaultValue={notice.body} rows={3} required className={inputClass} />
                          </label>
                          <label className="text-xs font-medium">
                            Publish at (UTC)
                            <input name="publishAt" type="datetime-local" defaultValue={local(notice.publishAt)} required className={inputClass} />
                          </label>
                          <label className="text-xs font-medium">
                            Expire at (UTC)
                            <input name="expireAt" type="datetime-local" defaultValue={notice.expireAt ? local(notice.expireAt) : ""} className={inputClass} />
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium">
                            <input name="pinned" type="checkbox" defaultChecked={notice.pinned} className="h-4 w-4 rounded border-border" />
                            Pin to top
                          </label>
                          <button type="submit" className={`${buttonClass} sm:col-span-2`}>Save notice</button>
                        </form>
                      </details>
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
