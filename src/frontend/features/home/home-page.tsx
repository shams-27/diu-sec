import { Suspense } from "react";
import Link from "next/link";
import { SectionTitle } from "@/frontend/shared/page-hero";
import { StatNumber } from "@/frontend/features/home/stat-number";
import { getHomeHighlights } from "@/backend/features/home/queries";

const IMPACT = [
  { value: "1,200+", label: "Members" },
  { value: "25+", label: "Hackathons" },
  { value: "80+", label: "Workshops" },
  { value: "150+", label: "Projects" },
];

const HERO_BANNER_CLASS =
  "brutal-callout mt-8 min-h-60 w-full max-w-3xl bg-primary p-5 text-primary-foreground xl:absolute xl:right-10 xl:top-10 xl:mt-0 xl:w-80";

const MANIFESTO = [
  {
    title: "Learn by building",
    body: "Workshops, courses and hackathons turn lectures into skills you can show, ship and defend.",
  },
  {
    title: "Compete together",
    body: "Our competitive programming and security wings train as teams for ICPC, NCPC and national contests.",
  },
  {
    title: "Give back",
    body: "Seniors mentor freshers, share roadmaps and open-source everything we can, so nobody starts alone.",
  },
];

async function HeroEventBanner() {
  const { nextEvent, nowIso } = await getHomeHighlights();
  const ongoing = nextEvent ? nextEvent.startsAt.getTime() <= Date.parse(nowIso) : false;
  const linkClass =
    "mt-4 inline-block border-t-2 border-current pt-2 font-mono text-xs font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground";
  return (
    <aside aria-label="Next event" className={HERO_BANNER_CLASS}>
      <p className="font-mono text-xs font-bold uppercase tracking-[0.2em]">Next event</p>
      {nextEvent ? (
        <>
          <p className="mt-3 line-clamp-2 font-heading text-3xl leading-tight xl:text-4xl">{nextEvent.title}</p>
          <p className="mt-3 font-mono text-xs font-bold uppercase tracking-widest">
            {ongoing ? "Happening now" : nextEvent.type.replace("_", " ")}
          </p>
          <p className="mt-2 text-sm tabular-nums">
            {nextEvent.startsAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            })}
          </p>
          <p className="mt-1 text-sm tabular-nums">
            {nextEvent.capacity > nextEvent.seatsTaken
              ? `${nextEvent.capacity - nextEvent.seatsTaken} seats left`
              : "Full"}
          </p>
          <Link href={`/events/${nextEvent.slug}`} className={linkClass}>
            Event details →
          </Link>
        </>
      ) : (
        <>
          <p className="mt-6 font-heading text-3xl leading-none">Nothing scheduled</p>
          <Link href="/events" className={linkClass}>
            Browse events →
          </Link>
        </>
      )}
    </aside>
  );
}

async function HomeHighlights() {
  const { upcoming, wings } = await getHomeHighlights();
  return (
    <>
      <section aria-labelledby="home-events-heading" className="space-y-5">
        <SectionTitle id="home-events-heading">Coming up next</SectionTitle>
        {upcoming.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No upcoming events published yet. Check back soon.
          </p>
        ) : (
          <ul className="stagger-in grid gap-4 md:grid-cols-3">
            {upcoming.map((event) => (
              <li key={event.id} className="card-lift rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill">{event.type.replace("_", " ")}</span>
                  {event.capacity > event.seatsTaken ? (
                    <span className="pill">{event.capacity - event.seatsTaken} seats left</span>
                  ) : (
                    <span className="pill border-destructive/40 text-destructive">Full</span>
                  )}
                </div>
                <h3 className="mt-4 font-heading text-2xl leading-tight tracking-wide">{event.title}</h3>
                <p className="mt-1 text-xs font-medium text-primary tabular-nums">
                  {event.startsAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </p>
                <Link
                  href={`/events/${event.slug}`}
                  className="mt-4 inline-block rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Event details →
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/events"
          className="inline-block rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          All events & courses →
        </Link>
      </section>

      <section aria-labelledby="home-wings-heading" className="space-y-5">
        <SectionTitle id="home-wings-heading">Find your wing</SectionTitle>
        {wings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Wings are being set up. Check back soon.
          </p>
        ) : (
          <ul className="stagger-in grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wings.map((wing) => (
              <li key={wing.id} className="card-lift rounded-2xl border border-border bg-card p-5">
                <h3 className="font-heading text-2xl tracking-wide">{wing.name}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{wing.description}</p>
                <Link
                  href={`/wings/${wing.slug}`}
                  className="mt-4 inline-block rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Meet the wing →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export function HomePage() {
  return (
    <div className="space-y-16">
      <section className="hero-surface relative overflow-hidden rounded-3xl border border-border px-6 py-12 sm:px-10 sm:py-16">
        <div className="dot-grid pointer-events-none absolute -right-12 -top-12 size-56 opacity-40" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <p className="eyebrow">Daffodil International University · Software Engineering</p>
          <h1 className="display-title mt-4">Build. Compete. Belong.</h1>
          <p className="lead-text mt-5">
            We are DIU SEC — a student-led community turning coursework into real products, contest wins and lifelong
            peers. Five wings, one club, open to every SWE student at DIU.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/join"
              className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Join the club
            </Link>
            <Link
              href="/events"
              className="rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors duration-200 hover:bg-muted motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Explore events
            </Link>
            <Link
              href="/verify"
              className="rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors duration-200 hover:bg-muted motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Verify a certificate
            </Link>
          </div>
        </div>
        <Suspense
          fallback={
            <div role="status" aria-live="polite" className={HERO_BANNER_CLASS}>
              <span className="sr-only">Loading next event</span>
            </div>
          }
        >
          <HeroEventBanner />
        </Suspense>
      </section>

      <section aria-labelledby="impact-heading" className="space-y-5">
        <SectionTitle id="impact-heading">Our impact</SectionTitle>
        <dl className="brutal-stats stagger-in grid grid-cols-2 gap-4 md:grid-cols-4">
          {IMPACT.map((item) => (
            <div key={item.label} className="card-lift rounded-2xl border border-border bg-card p-4 shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{item.label}</dt>
              <dd className="stat-value mt-3">
                <StatNumber value={item.value} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="manifesto-heading" className="space-y-5">
        <SectionTitle id="manifesto-heading">What we stand for</SectionTitle>
        <div className="stagger-in grid gap-4 md:grid-cols-3">
          {MANIFESTO.map((item, index) => (
            <article key={item.title} className="card-lift rounded-2xl border border-border bg-card p-6">
              <p className="font-mono text-xs font-semibold text-primary tabular-nums">0{index + 1}</p>
              <h3 className="mt-3 font-heading text-2xl tracking-wide">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* shortcut: fallback heights match the seeded highlights at these breakpoints; recheck if sections grow. */}
      <Suspense
        fallback={
          <div role="status" aria-live="polite" className="min-h-[1130px] sm:min-h-[850px] lg:min-h-[630px]">
            <span className="sr-only">Loading highlights</span>
          </div>
        }
      >
        <HomeHighlights />
      </Suspense>
    </div>
  );
}
