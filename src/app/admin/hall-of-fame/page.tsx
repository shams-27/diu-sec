import { getAllEntries } from "@/backend/features/hall-of-fame/queries";
import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { connection } from "next/server";
import { requireActor } from "@/backend/shared/admin-guard";
import { HOF_CATEGORIES } from "@/backend/shared/validators";
import { saveHallOfFameEntryAction } from "@/backend/features/hall-of-fame/hall-of-fame";

export const metadata: Metadata = { title: "Hall of fame · Admin" };

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const buttonClass =
  "rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primaryButtonClass =
  "w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function HallOfFameAdminPage() {
  await connection();
  await requireActor("hallOfFame", "read");
  const entries = await getAllEntries();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">A-09</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide">Hall of fame curator</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Record contest finalists, hackathon champions, GSoC selections and notable alumni.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 card-lift sm:p-5">
        <h2 className="font-heading text-2xl tracking-wide">Add an entry</h2>
        <form action={saveHallOfFameEntryAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">
            Category
            <select name="category" defaultValue="ICPC" className={inputClass}>
              {HOF_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium">
            Year
            <input name="year" type="number" min={2000} max={2100} required placeholder="2026" className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Title
            <input name="title" required minLength={3} maxLength={150} className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Person
            <input name="personName" required minLength={2} maxLength={100} className={inputClass} />
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            Description (optional)
            <textarea name="description" rows={2} maxLength={1000} className={inputClass} />
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            Image URL (optional)
            <input name="imageUrl" placeholder="https://... or /uploads/photo.png" className={inputClass} />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium">
            <input name="verified" type="checkbox" className="h-4 w-4 rounded border-border" />
            Verified
          </label>
          <button type="submit" className={`${primaryButtonClass} sm:col-span-2`}>Add entry</button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-heading text-2xl tracking-wide">
          <Trophy aria-hidden className="h-5 w-5 text-primary" />
          Entries
        </h2>
        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No hall of fame entries yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wide">
                <tr>
                  <th scope="col" className="px-3 py-2">Year</th>
                  <th scope="col" className="px-3 py-2">Entry</th>
                  <th scope="col" className="px-3 py-2">Category</th>
                  <th scope="col" className="px-3 py-2">Status</th>
                  <th scope="col" className="px-3 py-2">Edit</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted-foreground">{entry.year}</td>
                    <td className="max-w-[320px] px-3 py-2">
                      <p className="font-medium">{entry.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{entry.personName}</p>
                      {entry.imageUrl ? (
                        <a href={entry.imageUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          Image
                        </a>
                      ) : null}
                    </td>
                    <td className="px-3 py-2"><span className="pill">{entry.category}</span></td>
                    <td className="px-3 py-2"><span className="pill">{entry.verified ? "Verified" : "Pending"}</span></td>
                    <td className="min-w-[300px] px-3 py-2">
                      <details>
                        <summary className="cursor-pointer text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          Edit entry
                        </summary>
                        <form action={saveHallOfFameEntryAction} className="mt-3 grid gap-2 sm:grid-cols-2">
                          <input type="hidden" name="id" value={entry.id} />
                          <label className="text-xs font-medium">
                            Category
                            <select name="category" defaultValue={entry.category} className={inputClass}>
                              {HOF_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                          </label>
                          <label className="text-xs font-medium">
                            Year
                            <input name="year" type="number" min={2000} max={2100} defaultValue={entry.year} required className={inputClass} />
                          </label>
                          <label className="text-xs font-medium">
                            Title
                            <input name="title" defaultValue={entry.title} required className={inputClass} />
                          </label>
                          <label className="text-xs font-medium">
                            Person
                            <input name="personName" defaultValue={entry.personName} required className={inputClass} />
                          </label>
                          <label className="text-xs font-medium sm:col-span-2">
                            Description
                            <textarea name="description" defaultValue={entry.description ?? ""} rows={2} className={inputClass} />
                          </label>
                          <label className="text-xs font-medium sm:col-span-2">
                            Image URL
                            <input name="imageUrl" defaultValue={entry.imageUrl ?? ""} className={inputClass} />
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium">
                            <input name="verified" type="checkbox" defaultChecked={entry.verified} className="h-4 w-4 rounded border-border" />
                            Verified
                          </label>
                          <button type="submit" className={`${buttonClass} sm:col-span-2`}>Save entry</button>
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
