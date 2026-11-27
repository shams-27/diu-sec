import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowUpRight } from "lucide-react";
import { PageHero, SectionTitle } from "@/components/public/page-hero";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Wings",
  description: "The five engineering wings of DIU SEC and the students who lead them.",
};

export default async function WingsPage() {
  await connection();
  const wings = await db.wing.findMany({
    orderBy: { name: "asc" },
    include: {
      members: {
        include: { member: { select: { name: true } } },
        orderBy: { role: "asc" },
      },
    },
  });

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Five wings · one club"
        title="Find your people"
        description="Each wing runs its own sessions, projects and contests. Join the one you love — or several."
      />

      <section aria-labelledby="wings-heading" className="space-y-5">
        <SectionTitle id="wings-heading">Explore the wings</SectionTitle>
        {wings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No wings have been published yet.
          </p>
        ) : (
          <ul className="stagger-in grid gap-5 md:grid-cols-2">
            {wings.map((wing, index) => {
              const lead = wing.members.find((entry) => entry.role === "LEAD");
              const cores = wing.members.filter((entry) => entry.role === "CORE");
              return (
                <li key={wing.id} className="card-lift relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <span
                    aria-hidden="true"
                    className="absolute -right-3 -top-5 font-heading text-8xl text-primary/10"
                  >
                    0{index + 1}
                  </span>
                  <p className="pill relative">{wing.members.length} members</p>
                  <h3 className="relative mt-4 font-heading text-2xl tracking-wide">{wing.name}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{wing.description}</p>
                  {wing.responsibilities.length > 0 ? (
                    <ul className="relative mt-4 space-y-1.5 text-sm">
                      {wing.responsibilities.slice(0, 3).map((item) => (
                        <li key={item} className="flex gap-2">
                          <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">
                      {lead ? <>Lead · <strong className="text-foreground">{lead.member.name}</strong></> : "Lead to be announced"}
                      {cores.length > 0 ? ` · ${cores.length} core` : ""}
                    </p>
                    <Link
                      href={`/wings/${wing.slug}`}
                      className="inline-flex items-center gap-1 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      View wing <ArrowUpRight aria-hidden="true" className="size-4" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
