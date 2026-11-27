import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PageHero, SectionTitle } from "@/components/public/page-hero";
import { db } from "@/lib/db";
import { eventFilterSchema } from "@/lib/validators";

export const metadata: Metadata = {
  title: "Events & courses",
  description: "DIU SEC hackathons, workshops and multi-week skill courses.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? (value[0] ?? "") : (value ?? "")]),
  );
  const parsed = eventFilterSchema.safeParse(flat);
  const tab = parsed.success ? (parsed.data.tab ?? "upcoming") : "upcoming";
  const events = await db.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { startsAt: tab === "past" ? "desc" : "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      description: true,
      startsAt: true,
      endsAt: true,
      capacity: true,
      seatsTaken: true,
      wing: { select: { name: true } },
    },
  });
  const now = new Date();
  const visible = events.filter((event) => (tab === "past" ? event.startsAt < now : event.startsAt >= now));

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Learn by doing"
        title="Events & courses"
        description="Hackathons, hands-on workshops and multi-week courses — built by students, open to students."
      />

      <nav aria-label="Event periods" className="flex gap-2">
        {(["upcoming", "past"] as const).map((value) => (
          <Link
            key={value}
            href={`/events?tab=${value}`}
            aria-current={tab === value ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm font-medium capitalize transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              tab === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
            }`}
          >
            {value}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="events-heading" className="space-y-5">
        <SectionTitle id="events-heading">{tab === "past" ? "Past events" : "Upcoming events"}</SectionTitle>
        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No {tab} events yet. Check back soon.
          </p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {visible.map((event) => {
              const percent = event.capacity > 0 ? Math.min(100, Math.round((event.seatsTaken / event.capacity) * 100)) : 0;
              const full = event.capacity === 0 || event.seatsTaken >= event.capacity;
              return (
                <li key={event.id} className="card-lift rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill">{event.type.replace("_", " ")}</span>
                    {event.wing ? <span className="pill">{event.wing.name}</span> : null}
                    {full ? <span className="pill border-destructive/40 text-destructive">Full</span> : null}
                  </div>
                  <h3 className="mt-4 font-heading text-2xl leading-tight tracking-wide">{event.title}</h3>
                  <p className="mt-1 text-xs font-medium text-primary tabular-nums">
                    {event.startsAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{event.description}</p>
                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{event.seatsTaken} / {event.capacity} seats</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={event.seatsTaken} aria-valuemin={0} aria-valuemax={event.capacity} aria-label={`Seats taken for ${event.title}`}>
                      <div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <Link
                    href={`/events/${event.slug}`}
                    className="mt-5 inline-block rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Event details →
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
