import { connection } from "next/server";
import { requireActor } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { auditFilterSchema, nextUtcMidnight } from "@/lib/validators";

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT", "REVOKE", "REISSUE", "PUBLISH", "LOGIN", "EXPORT"] as const;
const inputClass =
  "rounded-md border border-border bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  await requireActor("audit", "read");
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? (value[0] ?? "") : (value ?? "")]),
  );
  const parsed = auditFilterSchema.safeParse(flat);
  const filters = parsed.success ? parsed.data : {};

  const logs = await db.auditLog.findMany({
    where: {
      action: filters.action,
      entity: filters.entity ? { contains: filters.entity, mode: "insensitive" } : undefined,
      actor: filters.email ? { email: { equals: filters.email, mode: "insensitive" } } : undefined,
      createdAt: { gte: filters.from, lt: filters.to ? nextUtcMidnight(filters.to) : undefined },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl tracking-wide">Audit log</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Read-only activity history. Entries cannot be edited or deleted.
        </p>
      </div>

      <form method="get" className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 text-xs font-medium">
          Action
          <select name="action" defaultValue={filters.action ?? ""} className={inputClass}>
            <option value="">All</option>
            {ACTIONS.map((action) => <option key={action} value={action}>{action}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Entity
          <input name="entity" defaultValue={filters.entity ?? ""} className={inputClass} placeholder="User" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Actor email
          <input name="email" type="email" defaultValue={filters.email ?? ""} className={inputClass} placeholder="who@diu.edu.bd" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          From
          <input name="from" type="date" defaultValue={filters.from ? filters.from.toISOString().slice(0, 10) : ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          To
          <input name="to" type="date" defaultValue={filters.to ? filters.to.toISOString().slice(0, 10) : ""} className={inputClass} />
        </label>
        <button
          type="submit"
          className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2 lg:col-span-5"
        >
          Apply filters
        </button>
      </form>

      {logs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No audit entries match these filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide">
              <tr>
                <th scope="col" className="px-3 py-2">When</th>
                <th scope="col" className="px-3 py-2">Actor</th>
                <th scope="col" className="px-3 py-2">Action</th>
                <th scope="col" className="px-3 py-2">Entity</th>
                <th scope="col" className="px-3 py-2">ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-border">
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{log.createdAt.toISOString()}</td>
                  <td className="px-3 py-2">{log.actor?.email ?? log.actorEmail ?? "System"}</td>
                  <td className="px-3 py-2">{log.action}</td>
                  <td className="px-3 py-2">{log.entity}</td>
                  <td className="px-3 py-2 font-mono text-xs">{log.entityId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
