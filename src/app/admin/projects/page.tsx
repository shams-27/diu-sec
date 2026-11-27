import type { Metadata } from "next";
import { Code2 } from "lucide-react";
import { connection } from "next/server";
import { requireActor } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { reviewProjectAction, saveProjectAction } from "@/server/actions/projects";

export const metadata: Metadata = { title: "Projects · Admin" };

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const buttonClass =
  "rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primaryButtonClass =
  "w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const statusPill = (status: string) =>
  `pill ${status === "APPROVED" ? "text-primary" : status === "REJECTED" ? "border-destructive/40 text-destructive" : ""}`;

export default async function ProjectsAdminPage() {
  await connection();
  await requireActor("projects", "read");
  const projects = await db.project.findMany({ orderBy: [{ featured: "desc" }, { createdAt: "desc" }] });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">A-08</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide">Project moderation</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review club projects, verify GitHub links and feature the best work.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 card-lift sm:p-5">
        <h2 className="font-heading text-2xl tracking-wide">Add a project</h2>
        <form action={saveProjectAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">
            Title
            <input name="title" required minLength={3} maxLength={150} className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            GitHub URL
            <input name="githubUrl" type="url" required placeholder="https://github.com/owner/repo" className={inputClass} />
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            Description
            <textarea name="description" required minLength={10} maxLength={3000} rows={2} className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Demo URL (optional)
            <input name="demoUrl" type="url" className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Status
            <select name="status" defaultValue="SUBMITTED" className={inputClass}>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>
          <label className="text-xs font-medium">
            Tech stack (one per line)
            <textarea name="techStack" required rows={3} placeholder={"TypeScript\nPrisma"} className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Contributors (one per line)
            <textarea name="contributors" required rows={3} placeholder="Jane Doe" className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Tags (one per line)
            <textarea name="tags" required rows={3} placeholder={"web\nopen-source"} className={inputClass} />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium">
            <input name="featured" type="checkbox" className="h-4 w-4 rounded border-border" />
            Featured project
          </label>
          <button type="submit" className={`${primaryButtonClass} sm:col-span-2`}>Add project</button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-heading text-2xl tracking-wide">
          <Code2 aria-hidden className="h-5 w-5 text-primary" />
          Submitted projects
        </h2>
        {projects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No projects submitted yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wide">
                <tr>
                  <th scope="col" className="px-3 py-2">Project</th>
                  <th scope="col" className="px-3 py-2">Tech stack</th>
                  <th scope="col" className="px-3 py-2">Status</th>
                  <th scope="col" className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-t border-border align-top">
                    <td className="max-w-[300px] px-3 py-2">
                      <p className="font-medium">{project.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{project.description}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-primary">
                        <a href={project.githubUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">GitHub</a>
                        {project.demoUrl ? (
                          <a href={project.demoUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Live demo</a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {project.techStack.slice(0, 4).map((tech) => <span key={tech} className="pill">{tech}</span>)}
                        {project.techStack.length > 4 ? <span className="pill">+{project.techStack.length - 4}</span> : null}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={statusPill(project.status)}>{project.status}</span>
                      {project.featured ? <span className="pill ml-2">Featured</span> : null}
                    </td>
                    <td className="min-w-[300px] px-3 py-2">
                      <form action={reviewProjectAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={project.id} />
                        <label className="flex items-center gap-1 text-xs font-medium">
                          <input name="featured" type="checkbox" defaultChecked={project.featured} className="h-4 w-4 rounded border-border" />
                          Featured
                        </label>
                        <button type="submit" name="decision" value="APPROVE" className={buttonClass}>Approve</button>
                        <button type="submit" name="decision" value="REJECT" className={buttonClass}>Reject</button>
                      </form>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          Edit details
                        </summary>
                        <form action={saveProjectAction} className="mt-3 grid gap-2 sm:grid-cols-2">
                          <input type="hidden" name="id" value={project.id} />
                          <label className="text-xs font-medium">
                            Title
                            <input name="title" defaultValue={project.title} required className={inputClass} />
                          </label>
                          <label className="text-xs font-medium">
                            GitHub URL
                            <input name="githubUrl" type="url" defaultValue={project.githubUrl} required className={inputClass} />
                          </label>
                          <label className="text-xs font-medium sm:col-span-2">
                            Description
                            <textarea name="description" defaultValue={project.description} rows={2} required className={inputClass} />
                          </label>
                          <label className="text-xs font-medium">
                            Demo URL
                            <input name="demoUrl" type="url" defaultValue={project.demoUrl ?? ""} className={inputClass} />
                          </label>
                          <label className="text-xs font-medium">
                            Status
                            <select name="status" defaultValue={project.status} className={inputClass}>
                              <option value="SUBMITTED">Submitted</option>
                              <option value="APPROVED">Approved</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                          </label>
                          <label className="text-xs font-medium">
                            Tech stack
                            <textarea name="techStack" defaultValue={project.techStack.join("\n")} rows={3} required className={inputClass} />
                          </label>
                          <label className="text-xs font-medium">
                            Contributors
                            <textarea name="contributors" defaultValue={project.contributors.join("\n")} rows={3} required className={inputClass} />
                          </label>
                          <label className="text-xs font-medium">
                            Tags
                            <textarea name="tags" defaultValue={project.tags.join("\n")} rows={3} required className={inputClass} />
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium">
                            <input name="featured" type="checkbox" defaultChecked={project.featured} className="h-4 w-4 rounded border-border" />
                            Featured
                          </label>
                          <button type="submit" className={`${buttonClass} sm:col-span-2`}>Save project</button>
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
