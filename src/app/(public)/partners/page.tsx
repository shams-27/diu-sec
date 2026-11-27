import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { connection } from "next/server";
import { PageHero, SectionTitle } from "@/components/public/page-hero";
import { db } from "@/lib/db";
import { SPONSOR_KINDS } from "@/lib/validators";

export const metadata: Metadata = {
  title: "Partners & Sponsors",
  description: "Industry partners, sponsors and faculty advisors supporting DIU SEC.",
};

const kindLabels: Record<(typeof SPONSOR_KINDS)[number], string> = {
  PARTNER: "Industry partners",
  SPONSOR: "Sponsors",
  FACULTY_ADVISOR: "Faculty advisors",
};

export default async function PartnersPage() {
  await connection();
  const sponsors = await db.sponsor.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, kind: true, name: true, logoUrl: true, websiteUrl: true, tier: true, bio: true },
  });

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Our community"
        title="Partners & sponsors"
        description="The organisations and Department of SWE faculty who back our events, projects and members."
      />

      {sponsors.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No partners or sponsors have been announced yet. Check back soon.
        </p>
      ) : (
        <div className="space-y-10">
          {SPONSOR_KINDS.map((kind) => {
            const group = sponsors.filter((sponsor) => sponsor.kind === kind);
            if (group.length === 0) return null;
            return (
              <section key={kind} aria-labelledby={`sponsors-${kind.toLowerCase()}`} className="space-y-5">
                <SectionTitle id={`sponsors-${kind.toLowerCase()}`}>{kindLabels[kind]}</SectionTitle>
                <ul className="stagger-in grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((sponsor) => (
                    <li key={sponsor.id} className="card-lift rounded-2xl border border-border bg-card p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        {sponsor.logoUrl ? (
                          // Logo URLs are validated on upload; plain img keeps this server component cheap.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sponsor.logoUrl}
                            alt=""
                            className="size-16 shrink-0 rounded-xl border border-border object-contain p-1"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="grid size-16 shrink-0 place-items-center rounded-xl bg-muted font-heading text-2xl text-primary"
                          >
                            {sponsor.name.slice(0, 1)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-heading text-xl leading-tight tracking-wide">{sponsor.name}</h3>
                          {sponsor.tier ? <p className="mt-1 text-sm font-semibold text-primary">{sponsor.tier}</p> : null}
                        </div>
                      </div>
                      {sponsor.bio ? (
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{sponsor.bio}</p>
                      ) : null}
                      {sponsor.websiteUrl ? (
                        <a
                          href={sponsor.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-5 inline-flex max-w-full items-start gap-2 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ExternalLink aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                          <span className="break-all">{sponsor.websiteUrl}</span>
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
