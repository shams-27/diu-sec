import type { Metadata } from "next";
import { connection } from "next/server";
import { CommitteeReorder } from "@/components/admin/committee-reorder";
import { requireActor } from "@/backend/shared/admin-guard";
import { db } from "@/backend/shared/db";
import { sessionFilterSchema } from "@/backend/shared/validators";
import {
  createSessionAction,
  deleteCommitteeMemberAction,
  manageSessionAction,
  saveCommitteeMemberAction,
} from "@/server/actions/committee";

export const metadata: Metadata = { title: "Committee & sessions · Admin" };

const inputClass =
  "rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const buttonClass =
  "rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function CommitteeAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  await requireActor("committee", "read");
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? (value[0] ?? "") : (value ?? "")]),
  );
  const parsed = sessionFilterSchema.safeParse(flat);
  const sessions = await db.execSession.findMany({ orderBy: { year: "desc" }, include: { _count: { select: { members: true } } } });
  const selected =
    sessions.find((session) => session.year === (parsed.success ? parsed.data.year : undefined)) ??
    sessions.find((session) => session.isCurrent) ??
    sessions[0];
  const members = selected
    ? await db.committeeMember.findMany({ where: { sessionId: selected.id }, orderBy: { order: "asc" } })
    : [];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">A-03</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide">Committee & sessions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage panels, portraits, titles and display order.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <form action={createSessionAction} className="space-y-3 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">New session</p>
            <label className="block text-xs font-medium">
              Year
              <input name="year" type="number" min={2000} max={2100} required className={`mt-1 w-full ${inputClass}`} />
            </label>
            <label className="block text-xs font-medium">
              Label
              <input name="label" required maxLength={100} placeholder="2027 Executive Committee" className={`mt-1 w-full ${inputClass}`} />
            </label>
            <button type="submit" className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Create session
            </button>
          </form>

          {sessions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No sessions yet. Create one to start building a panel.
            </p>
          ) : (
            <ul className="space-y-3">
              {sessions.map((session) => (
                <li key={session.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-heading text-xl">{session.year}</p>
                      <p className="text-xs text-muted-foreground">
                        {session._count.members} members {session.isCurrent ? "· current" : ""}{" "}
                        {session.archived ? "· archived" : ""}
                      </p>
                    </div>
                    <a href={`/admin/committee?year=${session.year}`} className="text-xs font-semibold text-primary underline-offset-4 hover:underline">
                      Select
                    </a>
                  </div>
                  {session.id === selected?.id ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        ["SET_CURRENT", "Make current"],
                        [session.archived ? "UNARCHIVE" : "ARCHIVE", session.archived ? "Unarchive" : "Archive"],
                      ].map(([decision, label]) => (
                        <form key={decision} action={manageSessionAction}>
                          <input type="hidden" name="sessionId" value={session.id} />
                          <input type="hidden" name="decision" value={decision} />
                          <button type="submit" className={buttonClass}>{label}</button>
                        </form>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          {selected ? (
            <>
              <section className="space-y-4">
                <h2 className="font-heading text-2xl tracking-wide">{selected.label}</h2>
                {members.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No members in this panel yet — add the first one below.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="bg-muted text-xs uppercase tracking-wide">
                        <tr>
                          <th scope="col" className="px-3 py-2">Member</th>
                          <th scope="col" className="px-3 py-2">Title</th>
                          <th scope="col" className="px-3 py-2">Batch</th>
                          <th scope="col" className="px-3 py-2">Edit</th>
                          <th scope="col" className="px-3 py-2">Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member) => (
                          <tr key={member.id} className="border-t border-border align-top">
                            <td className="px-3 py-2">
                              {member.name}
                              {member.photoUrl ? (
                                <span className="ml-2 text-xs text-primary">photo</span>
                              ) : null}
                            </td>
                            <td className="px-3 py-2">{member.title}</td>
                            <td className="px-3 py-2">{member.batch ?? "—"}</td>
                            <td className="px-3 py-2">
                              <details>
                                <summary className="cursor-pointer text-xs font-semibold text-primary">Edit</summary>
                                <form action={saveCommitteeMemberAction} className="mt-2 grid gap-2 sm:grid-cols-2">
                                  <input type="hidden" name="id" value={member.id} />
                                  <input type="hidden" name="sessionId" value={selected.id} />
                                  <input name="name" defaultValue={member.name} aria-label="Name" className={inputClass} />
                                  <input name="title" defaultValue={member.title} aria-label="Title" className={inputClass} />
                                  <input name="batch" defaultValue={member.batch ?? ""} aria-label="Batch" className={inputClass} />
                                  <input name="order" type="number" min={0} defaultValue={member.order} aria-label="Order" className={inputClass} />
                                  <input name="photoUrl" defaultValue={typeof member.photoUrl === "string" ? member.photoUrl : ""} aria-label="Photo URL" className={`${inputClass} sm:col-span-2`} />
                                  <input name="socialLinks" defaultValue={JSON.stringify(member.socialLinks ?? {})} aria-label="Social links JSON" className={`${inputClass} sm:col-span-2`} />
                                  <button type="submit" className={buttonClass}>Save</button>
                                </form>
                              </details>
                            </td>
                            <td className="px-3 py-2">
                              <form action={deleteCommitteeMemberAction}>
                                <input type="hidden" name="id" value={member.id} />
                                <button type="submit" className="text-xs font-semibold text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                  Remove
                                </button>
                              </form>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <CommitteeReorder
                  sessionId={selected.id}
                  items={members.map((member) => ({ id: member.id, name: member.name, title: member.title }))}
                />
              </section>

              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-heading text-2xl tracking-wide">Add a member</h2>
                <form action={saveCommitteeMemberAction} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="sessionId" value={selected.id} />
                  <label className="text-xs font-medium">Name <input name="name" required className={`mt-1 w-full ${inputClass}`} /></label>
                  <label className="text-xs font-medium">Title <input name="title" required className={`mt-1 w-full ${inputClass}`} /></label>
                  <label className="text-xs font-medium">Batch <input name="batch" className={`mt-1 w-full ${inputClass}`} /></label>
                  <label className="text-xs font-medium">Order <input name="order" type="number" min={0} defaultValue={members.length} className={`mt-1 w-full ${inputClass}`} /></label>
                  <label className="text-xs font-medium sm:col-span-2">Portrait (jpg/png/webp, ≤ 5 MB) <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={`mt-1 w-full ${inputClass}`} /></label>
                  <label className="text-xs font-medium sm:col-span-2">Social links JSON <input name="socialLinks" placeholder='{"linkedin":"https://…"}' className={`mt-1 w-full ${inputClass}`} /></label>
                  <button type="submit" className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2">
                    Add member
                  </button>
                </form>
              </section>
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Select or create a session to manage its members.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
