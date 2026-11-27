import { getPublishedEventBySlug } from "@/backend/features/events/queries";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { EventRegistration } from "@/frontend/features/events/event-registration";
import { SyllabusDialog } from "@/frontend/features/events/syllabus-dialog";
import { PageHero } from "@/frontend/shared/page-hero";



function prettySyllabus(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  const syllabus = prettySyllabus(event.syllabus);
  const full = event.capacity === 0 || event.seatsTaken >= event.capacity;
  const past = event.startsAt < new Date();

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow={`${event.type.replace("_", " ")}${event.wing ? ` · ${event.wing.name}` : ""}`}
        title={event.title}
        description={event.description}
      >
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-primary tabular-nums">
            {event.startsAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })}
            {event.endsAt ? ` → ${event.endsAt.toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" })}` : ""}
          </p>
          {syllabus ? <SyllabusDialog syllabus={syllabus} /> : null}
        </div>
      </PageHero>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading text-2xl tracking-wide">About this event</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{event.description}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading text-2xl tracking-wide">Seats</h2>
            <p className="mt-2 font-heading text-4xl tabular-nums text-primary">
              {event.seatsTaken}<span className="text-xl text-muted-foreground"> / {event.capacity}</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {full ? "All seats are taken." : `${Math.max(0, event.capacity - event.seatsTaken)} seats available.`}
            </p>
          </div>
          <Link href="/events" className="inline-block rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            ← All events
          </Link>
        </section>

        <aside aria-label="Registration">
          {past || full ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
              {past ? "This event has ended. Registrations are closed." : "Registration is closed — all seats are taken."}
            </div>
          ) : (
            <EventRegistration eventId={event.id} />
          )}
        </aside>
      </div>
    </div>
  );
}
