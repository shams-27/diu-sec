import { getAdminEventById } from "@/backend/features/events/queries";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireActor } from "@/backend/shared/admin-guard";



export async function AdminEventPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const actor = await requireActor("events", "read", "own");
  const { id } = await params;
  const event = await getAdminEventById(id, actor.role === "WING_LEAD" ? actor.wingId : undefined);
  if (!event) notFound();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">A-05 · {event.type}</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide">{event.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {event.wing?.name ?? "Club-wide"} · {event.seatsTaken}/{event.capacity} seats · {event.registrations.length} registrations
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/events" className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            ← Events
          </Link>
          <Link href={`/admin/events/${event.id}/checkin`} className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Open check-in scanner
          </Link>
        </div>
      </div>

      {event.registrations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nobody has registered yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide">
              <tr>
                <th scope="col" className="px-3 py-2">Name</th>
                <th scope="col" className="px-3 py-2">Email</th>
                <th scope="col" className="px-3 py-2">QR token</th>
                <th scope="col" className="px-3 py-2">Status</th>
                <th scope="col" className="px-3 py-2">Checked in</th>
              </tr>
            </thead>
            <tbody>
              {event.registrations.map((registration) => (
                <tr key={registration.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{registration.name}</td>
                  <td className="px-3 py-2">{registration.email}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{registration.qrToken}</td>
                  <td className="px-3 py-2"><span className="pill">{registration.status}</span></td>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">
                    {registration.checkedInAt?.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) ?? "Not checked in"}
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
