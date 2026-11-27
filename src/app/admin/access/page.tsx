import { connection } from "next/server";
import { requireActor } from "@/backend/shared/admin-guard";
import { db } from "@/backend/shared/db";
import { setUserRoleAction } from "@/server/actions/access";

const ROLES = ["SUPER_ADMIN", "GENERAL_SECRETARY", "WING_LEAD", "PUBLICATION_EDITOR"] as const;

const selectClass =
  "rounded-md border border-border bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function AccessPage() {
  await connection();
  await requireActor("access", "read");
  const [users, wings] = await Promise.all([
    db.user.findMany({ include: { wing: true }, orderBy: { email: "asc" } }),
    db.wing.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl tracking-wide">Access &amp; roles</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Assign club roles and wings. Every change is written to the immutable audit log.
        </p>
      </div>

      {users.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No admin users yet. Seed a super admin to get started.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide">
              <tr>
                <th scope="col" className="px-3 py-2">User</th>
                <th scope="col" className="px-3 py-2">Role &amp; wing</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <span className="font-medium">{user.name ?? user.email}</span>
                    <span className="block text-xs text-muted-foreground">{user.email}</span>
                  </td>
                  <td className="px-3 py-2">
                    <form action={setUserRoleAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <label className="sr-only" htmlFor={`role-${user.id}`}>Role for {user.email}</label>
                      <select id={`role-${user.id}`} name="role" defaultValue={user.role ?? ""} className={selectClass}>
                        <option value="">No role (no admin access)</option>
                        {ROLES.map((role) => (
                          <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                        ))}
                      </select>
                      <label className="sr-only" htmlFor={`wing-${user.id}`}>Wing for {user.email}</label>
                      <select id={`wing-${user.id}`} name="wingId" defaultValue={user.wingId ?? ""} className={selectClass}>
                        <option value="">No wing</option>
                        {wings.map((wing) => (
                          <option key={wing.id} value={wing.id}>{wing.name}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-md bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Save
                      </button>
                    </form>
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
