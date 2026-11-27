import { getVerifiedEntries } from "@/backend/features/hall-of-fame/queries";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { connection } from "next/server";
import { PageHero, SectionTitle } from "@/frontend/shared/page-hero";
import { HOF_CATEGORIES, hallOfFameFilterSchema } from "@/backend/shared/validators";



export async function HallOfFamePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? (value[0] ?? "") : (value ?? "")]),
  );
  const parsed = hallOfFameFilterSchema.safeParse(flat);
  const category = parsed.success ? parsed.data.category : undefined;
  const entries = await getVerifiedEntries(category);

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Hall of fame"
        title="Our achievers"
        description="Contest finalists, hackathon champions, GSoC selections and alumni who carry the SEC name forward."
      >
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <Trophy aria-hidden="true" className="size-4" />
          {entries.length} verified {entries.length === 1 ? "entry" : "entries"}
        </p>
      </PageHero>

      <nav aria-label="Hall of fame categories" className="flex flex-wrap gap-2">
        <Link
          href="/hall-of-fame"
          aria-current={category === undefined ? "page" : undefined}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            category === undefined ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
          }`}
        >
          All
        </Link>
        {HOF_CATEGORIES.map((value) => (
          <Link
            key={value}
            href={`/hall-of-fame?category=${value}`}
            aria-current={category === value ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              category === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
            }`}
          >
            {value}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="entries-heading" className="space-y-5">
        <SectionTitle id="entries-heading">{category ? `${category} achievers` : "All achievers"}</SectionTitle>
        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No verified entries in this category yet. Check back soon.
          </p>
        ) : (
          <ul className="stagger-in grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <li key={entry.id} className="card-lift rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  {entry.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.imageUrl}
                      alt=""
                      className="size-16 shrink-0 rounded-xl border border-border object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="grid size-16 shrink-0 place-items-center rounded-xl bg-muted font-heading text-2xl text-primary"
                    >
                      {entry.personName.slice(0, 1)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="pill">{entry.category}</span>
                      <span className="text-xs font-medium text-primary tabular-nums">{entry.year}</span>
                    </div>
                    <h3 className="mt-2 font-heading text-xl leading-tight tracking-wide">{entry.personName}</h3>
                    <p className="mt-1 text-sm font-semibold text-primary">{entry.title}</p>
                  </div>
                </div>
                {entry.description ? (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{entry.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
