import type { Metadata } from "next";
import { connection } from "next/server";
import { requireActor } from "@/backend/shared/admin-guard";
import { db } from "@/backend/shared/db";
import { manageWingRosterAction, saveWingAction } from "@/server/actions/wings";

export const metadata: Metadata = { title: "Wings & rosters · Admin" };

const inputClass =
  "rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const buttonClass =
  "rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function WingsAdminPage() {
  await connection();
  const actor = await requireActor("wings", "read", "own");
  const wingWhere = actor.role === "WING_LEAD" && actor.wingId ? { id: actor.wingId } : {};
  const [wings, members] = await Promise.all([
    db.wing.findMany({
      where: wingWhere,
      orderBy: { name: "asc" },
      include: {
        members: { include: { member: { select: { name: true, batch: true, status: true } } } },
      },
    }),
    db.member.findMany({
      where: { status: "APPROVED", wingPrefId: actor.role === "WING_LEAD" ? (actor.wingId ?? undefined) : undefined },
      select: { id: true, name: true, batch: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">A-04</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide">Wings & rosters</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Edit wing details, assign a lead and maintain the core roster.
          {actor.role === "WING_LEAD" ? " You can only change your own wing." : ""}
        </p>
      </div>

      {wings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No wings are available to you yet.
        </p>
      ) : (
        <div className="space-y-6">
          {wings.map((wing) => {
            const lead = wing.members.find((entry) => entry.role === "LEAD");
            return (
              <section key={wing.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-2xl tracking-wide">{wing.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {lead ? `Lead · ${lead.member.name}` : "No lead assigned"} · {wing.members.length} roster members
                    </p>
                  </div>
                  <span className="pill">/{wing.slug}</span>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Edit wing & assign lead
                  </summary>
                  <form action={saveWingAction} className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="wingId" value={wing.id} />
                    <label className="text-xs font-medium">Name <input name="name" defaultValue={wing.name} required className={`mt-1 w-full ${inputClass}`} /></label>
                    <label className="text-xs font-medium">Syllabus URL <input name="syllabusUrl" type="url" defaultValue={wing.syllabusUrl ?? ""} className={`mt-1 w-full ${inputClass}`} /></label>
                    <label className="text-xs font-medium sm:col-span-2">Description <textarea name="description" defaultValue={wing.description} rows={2} required className={`mt-1 w-full ${inputClass}`} /></label>
                    <label className="text-xs font-medium sm:col-span-2">Responsibilities (one per line) <textarea name="responsibilities" defaultValue={wing.responsibilities.join("\n")} rows={3} className={`mt-1 w-full ${inputClass}`} /></label>
                    <label className="text-xs font-medium sm:col-span-2">
                      Wing lead
                      <select name="leadMemberId" defaultValue={lead?.memberId ?? ""} className={`mt-1 w-full ${inputClass}`}>
                        <option value="">No lead</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>{member.name}{member.batch ? ` · ${member.batch}` : ""}</option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" className={`w-fit ${buttonClass} sm:col-span-2`}>Save wing</button>
                  </form>
                </details>

                <div className="mt-5 overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-muted text-xs uppercase tracking-wide">
                      <tr>
                        <th scope="col" className="px-3 py-2">Member</th>
                        <th scope="col" className="px-3 py-2">Role</th>
                        <th scope="col" className="px-3 py-2">Update</th>
                        <th scope="col" className="px-3 py-2">Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wing.members.length === 0 ? (
                        <tr><td colSpan={4} className="px-3 py-5 text-center text-sm text-muted-foreground">No roster members yet.</td></tr>
                      ) : (
                        wing.members.map((entry) => (
                          <tr key={entry.id} className="border-t border-border">
                            <td className="px-3 py-2">{entry.member.name}<span className="block text-xs text-muted-foreground">{entry.member.batch ?? "—"} · {entry.member.status}</span></td>
                            <td className="px-3 py-2">
                              <form action={manageWingRosterAction} className="flex flex-wrap gap-2">
                                <input type="hidden" name="wingId" value={wing.id} />
                                <input type="hidden" name="memberId" value={entry.memberId} />
                                <input type="hidden" name="decision" value="UPDATE" />
                                <select name="role" aria-label={`Role for ${entry.member.name}`} defaultValue={entry.role} className={inputClass}>
                                  <option value="LEAD">Lead</option>
                                  <option value="CORE">Core</option>
                                  <option value="MEMBER">Member</option>
                                </select>
                                <button type="submit" className={buttonClass}>Save</button>
                              </form>
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">—</td>
                            <td className="px-3 py-2">
                              <form action={manageWingRosterAction}>
                                <input type="hidden" name="wingId" value={wing.id} />
                                <input type="hidden" name="memberId" value={entry.memberId} />
                                <input type="hidden" name="decision" value="REMOVE" />
                                <input type="hidden" name="role" value="MEMBER" />
                                <button type="submit" className="text-xs font-semibold text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Remove</button>
                              </form>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <form action={manageWingRosterAction} className="mt-4 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="wingId" value={wing.id} />
                  <input type="hidden" name="decision" value="ADD" />
                  <label className="text-xs font-medium">Add approved member
                    <select name="memberId" required className={`mt-1 block ${inputClass}`}>
                      <option value="">Choose a member</option>
                      {members.filter((member) => !wing.members.some((entry) => entry.memberId === member.id)).map((member) => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-medium">Role
                    <select name="role" defaultValue="MEMBER" className={`mt-1 block ${inputClass}`}>
                      <option value="LEAD">Lead</option>
                      <option value="CORE">Core</option>
                      <option value="MEMBER">Member</option>
                    </select>
                  </label>
                  <button type="submit" className={buttonClass}>Add to roster</button>
                </form>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
