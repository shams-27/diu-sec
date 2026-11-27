import { getMemberQueue, getWingOptions } from "@/backend/features/membership/queries";
import Link from "next/link";
import { connection } from "next/server";
import { requireActor } from "@/backend/shared/admin-guard";
import { memberFilterSchema } from "@/backend/shared/validators";
import { reviewMemberAction } from "@/backend/features/membership/member-review";



type SearchParams = Record<string, string | string[] | undefined>;
const inputClass =
  "rounded-md border border-border bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export async function AdminMembersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const actor = await requireActor("members", "read", "own");
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? (value[0] ?? "") : (value ?? "")]),
  );
  const parsed = memberFilterSchema.safeParse(flat);
  const filters = parsed.success ? parsed.data : {};
  const wingId = actor.role === "WING_LEAD" ? actor.wingId : filters.wingPrefId;

  const [wings, members] = await Promise.all([
    actor.role === "WING_LEAD" ? Promise.resolve([]) : getWingOptions(),
    getMemberQueue(filters.status, wingId),
  ]);

  const query = new URLSearchParams();
  if (filters.status) query.set("status", filters.status);
  if (wingId) query.set("wingPrefId", wingId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl tracking-wide">Members</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review applications and manage digital member ID cards.
          </p>
        </div>
        <Link
          href={`/api/admin/members/export?${query.toString()}`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Export CSV
        </Link>
      </div>

      <form method="get" className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium">
          Status
          <select name="status" defaultValue={filters.status ?? ""} className={inputClass}>
            <option value="">All</option>
            {["PENDING", "APPROVED", "REJECTED", "REVOKED"].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        {actor.role === "WING_LEAD" ? null : (
          <label className="flex flex-col gap-1 text-xs font-medium">
            Preferred wing
            <select name="wingPrefId" defaultValue={filters.wingPrefId ?? ""} className={inputClass}>
              <option value="">All</option>
              {wings.map((wing) => (
                <option key={wing.id} value={wing.id}>{wing.name}</option>
              ))}
            </select>
          </label>
        )}
        <button type="submit" className="w-fit rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2">
          Apply filters
        </button>
      </form>

      {members.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No applications match these filters yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide">
              <tr>
                <th scope="col" className="px-3 py-2">Applicant</th>
                <th scope="col" className="px-3 py-2">Student ID</th>
                <th scope="col" className="px-3 py-2">Wing</th>
                <th scope="col" className="px-3 py-2">Status</th>
                <th scope="col" className="px-3 py-2">Card no.</th>
                <th scope="col" className="px-3 py-2">Review</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-t border-border align-top">
                  <td className="px-3 py-2">
                    <span className="font-medium">{member.name}</span>
                    <span className="block text-xs text-muted-foreground">{member.email}</span>
                    {member.batch ? <span className="block text-xs text-muted-foreground">Batch {member.batch}</span> : null}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{member.studentId}</td>
                  <td className="px-3 py-2">{member.wingPref?.name ?? "—"}</td>
                  <td className="px-3 py-2">{member.status}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{member.memberCardNo ?? "—"}</td>
                  <td className="px-3 py-2">
                    {actor.role === "WING_LEAD" ? (
                      <span className="text-xs text-muted-foreground">Read only</span>
                    ) : (
                      <form action={reviewMemberAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="memberId" value={member.id} />
                        <select name="decision" aria-label={`Decision for ${member.name}`} defaultValue="APPROVE" className={inputClass}>
                          <option value="APPROVE">Approve</option>
                          <option value="REJECT">Reject</option>
                          <option value="REVOKE">Revoke</option>
                          <option value="REISSUE" disabled={member.status === "APPROVED"}>Reissue card</option>
                        </select>
                        <button type="submit" className="rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          Apply
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
