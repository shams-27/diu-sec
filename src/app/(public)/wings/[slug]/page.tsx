import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PageHero, SectionTitle } from "@/frontend/shared/page-hero";
import { db } from "@/backend/shared/db";

export const metadata: Metadata = { title: "Wing" };

export default async function WingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const wing = await db.wing.findUnique({
    where: { slug },
    include: {
      members: {
        include: { member: { select: { name: true, batch: true, status: true } } },
        orderBy: [{ role: "asc" }, { member: { name: "asc" } }],
      },
    },
  });
  if (!wing) notFound();

  const groups = [
    { label: "Wing lead", roles: ["LEAD"] },
    { label: "Core members", roles: ["CORE"] },
    { label: "Members", roles: ["MEMBER"] },
  ];

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="DIU SEC wing"
        title={wing.name}
        description={wing.description}
      >
        <div className="flex flex-wrap gap-3">
          <Link
            href="/join"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Join this wing
          </Link>
          {wing.syllabusUrl ? (
            <a
              href={wing.syllabusUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Wing syllabus ↗
            </a>
          ) : null}
        </div>
      </PageHero>

      <section aria-labelledby="duties-heading" className="space-y-4">
        <SectionTitle id="duties-heading">What this wing does</SectionTitle>
        {wing.responsibilities.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Responsibilities will be announced soon.
          </p>
        ) : (
          <ul className="stagger-in grid gap-3 sm:grid-cols-2">
            {wing.responsibilities.map((item) => (
              <li key={item} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
                {item}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="roster-heading" className="space-y-5">
        <SectionTitle id="roster-heading">Roster</SectionTitle>
        {wing.members.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            This wing has no roster members yet.
          </p>
        ) : (
          groups.map((group) => {
            const people = wing.members.filter((entry) => group.roles.includes(entry.role));
            if (people.length === 0) return null;
            return (
              <div key={group.label}>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">{group.label}</h3>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {people.map((entry) => (
                    <li key={entry.id} className="rounded-xl border border-border bg-card px-4 py-3">
                      <p className="font-medium">{entry.member.name}</p>
                      {entry.member.batch ? (
                        <p className="mt-1 text-xs text-muted-foreground">Batch {entry.member.batch}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>

      <Link
        href="/wings"
        className="inline-block rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        ← All wings
      </Link>
    </div>
  );
}
