import type { Metadata } from "next";
import { Handshake } from "lucide-react";
import { connection } from "next/server";
import { requireActor } from "@/backend/shared/admin-guard";
import { db } from "@/backend/shared/db";
import { SPONSOR_KINDS } from "@/backend/shared/validators";
import { saveSponsorAction } from "@/server/actions/sponsors";

export const metadata: Metadata = { title: "Sponsors · Admin" };

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const buttonClass =
  "rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primaryButtonClass =
  "w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function SponsorsAdminPage() {
  await connection();
  await requireActor("sponsors", "read");
  const sponsors = await db.sponsor.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">A-11</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide">Partners &amp; sponsors</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage industry partners, sponsors and faculty advisors from the Dept. of SWE.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 card-lift sm:p-5">
        <h2 className="font-heading text-2xl tracking-wide">Add an entry</h2>
        <form action={saveSponsorAction} encType="multipart/form-data" className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">
            Kind
            <select name="kind" defaultValue="PARTNER" className={inputClass}>
              {SPONSOR_KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium">
            Name
            <input name="name" required minLength={2} maxLength={150} className={inputClass} />
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            Logo (optional)
            <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Website URL (optional)
            <input name="websiteUrl" type="url" placeholder="https://..." className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Tier (optional)
            <input name="tier" maxLength={50} className={inputClass} />
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            Bio (optional)
            <textarea name="bio" rows={2} maxLength={500} className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Order
            <input name="order" type="number" min={0} max={9999} defaultValue={0} className={inputClass} />
          </label>
          <button type="submit" className={`${primaryButtonClass} sm:col-span-2`}>Add entry</button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-heading text-2xl tracking-wide">
          <Handshake aria-hidden className="h-5 w-5 text-primary" />
          Partners, sponsors &amp; advisors
        </h2>
        {sponsors.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No entries yet. Add the first one above.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wide">
                <tr>
                  <th scope="col" className="px-3 py-2">Name</th>
                  <th scope="col" className="px-3 py-2">Kind</th>
                  <th scope="col" className="px-3 py-2">Tier</th>
                  <th scope="col" className="px-3 py-2">Website</th>
                  <th scope="col" className="px-3 py-2">Order</th>
                  <th scope="col" className="px-3 py-2">Edit</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map((sponsor) => (
                  <tr key={sponsor.id} className="border-t border-border align-top">
                    <td className="max-w-[280px] px-3 py-2">
                      <p className="font-medium">{sponsor.name}</p>
                      {sponsor.logoUrl ? (
                        <a href={sponsor.logoUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          Logo
                        </a>
                      ) : null}
                      {sponsor.bio ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{sponsor.bio}</p> : null}
                    </td>
                    <td className="px-3 py-2"><span className="pill">{sponsor.kind}</span></td>
                    <td className="px-3 py-2">{sponsor.tier ?? "—"}</td>
                    <td className="px-3 py-2">
                      {sponsor.websiteUrl ? (
                        <a href={sponsor.websiteUrl} target="_blank" rel="noreferrer" className="break-all text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          Open link
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{sponsor.order}</td>
                    <td className="min-w-[320px] px-3 py-2">
                      <details>
                        <summary className="cursor-pointer text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          Edit entry
                        </summary>
                        <form action={saveSponsorAction} encType="multipart/form-data" className="mt-3 grid gap-2 sm:grid-cols-2">
                          <input type="hidden" name="id" value={sponsor.id} />
                          {sponsor.logoUrl ? <input type="hidden" name="logoUrl" value={sponsor.logoUrl} /> : null}
                          <label className="text-xs font-medium">
                            Kind
                            <select name="kind" defaultValue={sponsor.kind} className={inputClass}>
                              {SPONSOR_KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
                            </select>
                          </label>
                          <label className="text-xs font-medium">
                            Name
                            <input name="name" defaultValue={sponsor.name} required className={inputClass} />
                          </label>
                          <label className="text-xs font-medium sm:col-span-2">
                            Logo (optional)
                            <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className={inputClass} />
                          </label>
                          <label className="text-xs font-medium">
                            Website URL (optional)
                            <input name="websiteUrl" type="url" defaultValue={sponsor.websiteUrl ?? ""} className={inputClass} />
                          </label>
                          <label className="text-xs font-medium">
                            Tier (optional)
                            <input name="tier" maxLength={50} defaultValue={sponsor.tier ?? ""} className={inputClass} />
                          </label>
                          <label className="text-xs font-medium sm:col-span-2">
                            Bio (optional)
                            <textarea name="bio" rows={2} maxLength={500} defaultValue={sponsor.bio ?? ""} className={inputClass} />
                          </label>
                          <label className="text-xs font-medium">
                            Order
                            <input name="order" type="number" min={0} max={9999} defaultValue={sponsor.order} className={inputClass} />
                          </label>
                          <p className="text-xs text-muted-foreground sm:col-span-2">The current logo is kept unless you choose a new file.</p>
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
