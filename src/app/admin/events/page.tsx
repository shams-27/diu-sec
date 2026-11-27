import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { requireActor } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { manageEventAction, saveEventAction } from "@/server/actions/events";

export const metadata: Metadata = { title: "Events · Admin" };

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const buttonClass =
  "rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const local = (date: Date) => date.toISOString().slice(0, 16);

export default async function EventsAdminPage() {
  await connection();
  const actor = await requireActor("events", "read", "own");
  const wingWhere = actor.role === "WING_LEAD" && actor.wingId ? { wingId: actor.wingId } : {};
  const [events, wings] = await Promise.all([
    db.event.findMany({
      where: wingWhere,
      orderBy: { startsAt: "desc" },
      include: { wing: { select: { name: true } }, _count: { select: { registrations: true } } },
    }),
    actor.role === "WING_LEAD"
      ? Promise.resolve([])
      : db.wing.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">A-05</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide">Events, courses & attendance</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Publish events, watch seats fill and check attendees in with a QR scan.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl tracking-wide">Create an event</h2>
        <form action={saveEventAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">Title <input name="title" required minLength={3} className={inputClass} /></label>
          <label className="text-xs font-medium">Type
            <select name="type" defaultValue="WORKSHOP" className={inputClass}>
              <option value="HACKATHON">Hackathon</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="COURSE">Course</option>
            </select>
          </label>
          <label className="text-xs font-medium sm:col-span-2">Description <textarea name="description" required rows={2} className={inputClass} /></label>
          <label className="text-xs font-medium">Starts at (UTC) <input name="startsAt" type="datetime-local" required className={inputClass} /></label>
          <label className="text-xs font-medium">Ends at (UTC) <input name="endsAt" type="datetime-local" className={inputClass} /></label>
          <label className="text-xs font-medium">Capacity <input name="capacity" type="number" min={0} defaultValue={30} className={inputClass} /></label>
          <label className="text-xs font-medium">Status
            <select name="status" defaultValue="DRAFT" className={inputClass}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          {actor.role === "WING_LEAD" ? (
            <input type="hidden" name="wingId" value={actor.wingId ?? ""} />
          ) : (
            <label className="text-xs font-medium">Wing
              <select name="wingId" className={inputClass}>
                <option value="">No wing</option>
                {wings.map((wing) => <option key={wing.id} value={wing.id}>{wing.name}</option>)}
              </select>
            </label>
          )}
          <label className="text-xs font-medium sm:col-span-2">Syllabus (JSON object) <textarea name="syllabus" rows={3} defaultValue='{"schedule":[]}' className={inputClass} /></label>
          <button type="submit" className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2">
            Create event
          </button>
        </form>
      </section>

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No events in your scope yet.
        </p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <section key={event.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="pill">{event.status}</span>
                    <span className="pill">{event.type.replace("_", " ")}</span>
                  </div>
                  <h2 className="mt-3 font-heading text-2xl tracking-wide">{event.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                    {event.startsAt.toLocaleDateString("en-GB", { timeZone: "UTC" })} · {event.seatsTaken}/{event.capacity} seats · {event._count.registrations} registrations
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/events/${event.id}`} className={buttonClass}>Registrations</Link>
                  <Link href={`/admin/events/${event.id}/checkin`} className={buttonClass}>Check-in</Link>
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-primary">Edit details</summary>
                <form action={saveEventAction} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="id" value={event.id} />
                  {actor.role === "WING_LEAD" ? <input type="hidden" name="wingId" value={actor.wingId ?? ""} /> : null}
                  <label className="text-xs font-medium">Title <input name="title" defaultValue={event.title} className={inputClass} /></label>
                  <label className="text-xs font-medium">Type
                    <select name="type" defaultValue={event.type} className={inputClass}>
                      <option value="HACKATHON">Hackathon</option>
                      <option value="WORKSHOP">Workshop</option>
                      <option value="COURSE">Course</option>
                    </select>
                  </label>
                  <label className="text-xs font-medium sm:col-span-2">Description <textarea name="description" defaultValue={event.description} rows={2} className={inputClass} /></label>
                  <label className="text-xs font-medium">Starts at (UTC) <input name="startsAt" type="datetime-local" defaultValue={local(event.startsAt)} className={inputClass} /></label>
                  <label className="text-xs font-medium">Ends at (UTC) <input name="endsAt" type="datetime-local" defaultValue={event.endsAt ? local(event.endsAt) : ""} className={inputClass} /></label>
                  <label className="text-xs font-medium">Capacity <input name="capacity" type="number" min={0} defaultValue={event.capacity} className={inputClass} /></label>
                  <label className="text-xs font-medium">Status
                    <select name="status" defaultValue={event.status} className={inputClass}>
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </label>
                  {actor.role === "WING_LEAD" ? null : (
                    <label className="text-xs font-medium">Wing
                      <select name="wingId" defaultValue={event.wingId ?? ""} className={inputClass}>
                        <option value="">No wing</option>
                        {wings.map((wing) => <option key={wing.id} value={wing.id}>{wing.name}</option>)}
                      </select>
                    </label>
                  )}
                  <label className="text-xs font-medium sm:col-span-2">Syllabus (JSON object) <textarea name="syllabus" defaultValue={JSON.stringify(event.syllabus ?? {})} rows={3} className={inputClass} /></label>
                  <button type="submit" className={`w-fit ${buttonClass} sm:col-span-2`}>Save event</button>
                </form>
              </details>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ["PUBLISH", "Publish"],
                  ["ARCHIVE", "Archive"],
                  ["UNARCHIVE", "Back to draft"],
                ].map(([decision, label]) => (
                  <form key={decision} action={manageEventAction}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="decision" value={decision} />
                    <button type="submit" className={buttonClass}>{label}</button>
                  </form>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
