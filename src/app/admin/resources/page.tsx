import { getAllResources } from "@/backend/features/resources/queries";
import type { Metadata } from "next";
import { Link2 } from "lucide-react";
import { connection } from "next/server";
import { requireActor } from "@/backend/shared/admin-guard";
import { RESOURCE_TYPES } from "@/backend/shared/validators";
import { saveResourceAction } from "@/backend/features/resources/resources";

export const metadata: Metadata = { title: "Resources · Admin" };

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const buttonClass =
  "rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primaryButtonClass =
  "w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function ResourcesAdminPage() {
  await connection();
  await requireActor("resources", "read");
  const resources = await getAllResources();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">A-11</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide">Resources</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Curate CP sheets, roadmaps, GitHub repos and interview guides for members.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 card-lift sm:p-5">
        <h2 className="font-heading text-2xl tracking-wide">Add a resource</h2>
        <form action={saveResourceAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">
            Type
            <select name="type" defaultValue="CP_SHEET" className={inputClass}>
              {RESOURCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium">
            Title
            <input name="title" required minLength={3} maxLength={150} className={inputClass} />
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            URL
            <input name="url" type="url" required placeholder="https://..." className={inputClass} />
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            Tags (one per line)
            <textarea name="tags" required rows={3} placeholder={"cp\nbeginner"} className={inputClass} />
          </label>
          <button type="submit" className={`${primaryButtonClass} sm:col-span-2`}>Add resource</button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-heading text-2xl tracking-wide">
          <Link2 aria-hidden className="h-5 w-5 text-primary" />
          Published resources
        </h2>
        {resources.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No resources yet. Add the first one above.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wide">
                <tr>
                  <th scope="col" className="px-3 py-2">Resource</th>
                  <th scope="col" className="px-3 py-2">Type</th>
                  <th scope="col" className="px-3 py-2">Tags</th>
                  <th scope="col" className="px-3 py-2">Edit</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((resource) => (
                  <tr key={resource.id} className="border-t border-border align-top">
                    <td className="max-w-[300px] px-3 py-2">
                      <p className="font-medium">{resource.title}</p>
                      <a href={resource.url} target="_blank" rel="noreferrer" className="mt-1 inline-block break-all text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        Open link
                      </a>
                    </td>
                    <td className="px-3 py-2"><span className="pill">{resource.type}</span></td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {resource.tags.map((tag) => <span key={tag} className="pill">{tag}</span>)}
                      </div>
                    </td>
                    <td className="min-w-[300px] px-3 py-2">
                      <details>
                        <summary className="cursor-pointer text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          Edit resource
                        </summary>
                        <form action={saveResourceAction} className="mt-3 grid gap-2 sm:grid-cols-2">
                          <input type="hidden" name="id" value={resource.id} />
                          <label className="text-xs font-medium">
                            Type
                            <select name="type" defaultValue={resource.type} className={inputClass}>
                              {RESOURCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                            </select>
                          </label>
                          <label className="text-xs font-medium">
                            Title
                            <input name="title" defaultValue={resource.title} required className={inputClass} />
                          </label>
                          <label className="text-xs font-medium sm:col-span-2">
                            URL
                            <input name="url" type="url" defaultValue={resource.url} required className={inputClass} />
                          </label>
                          <label className="text-xs font-medium sm:col-span-2">
                            Tags (one per line)
                            <textarea name="tags" defaultValue={resource.tags.join("\n")} rows={3} required className={inputClass} />
                          </label>
                          <button type="submit" className={`${buttonClass} sm:col-span-2`}>Save resource</button>
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
