import { getResources } from "@/backend/features/resources/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { connection } from "next/server";
import { PageHero, SectionTitle } from "@/frontend/shared/page-hero";
import { RESOURCE_TYPES, resourceFilterSchema } from "@/backend/shared/validators";

export const metadata: Metadata = {
  title: "Resources",
  description: "CP sheets, roadmaps, GitHub repos and interview guides curated by DIU SEC.",
};

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? (value[0] ?? "") : (value ?? "")]),
  );
  const parsed = resourceFilterSchema.safeParse(flat);
  const type = parsed.success ? parsed.data.type : undefined;
  const resources = await getResources(type);

  const chipClass = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
    }`;

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Learn together"
        title="Resources"
        description="Everything we use to practise, build and get interview-ready — collected in one place."
      />

      <nav aria-label="Resource types" className="flex flex-wrap gap-2">
        <Link href="/resources" aria-current={type === undefined ? "page" : undefined} className={chipClass(type === undefined)}>
          All
        </Link>
        {RESOURCE_TYPES.map((value) => (
          <Link
            key={value}
            href={`/resources?type=${value}`}
            aria-current={type === value ? "page" : undefined}
            className={chipClass(type === value)}
          >
            {value}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="resources-heading" className="space-y-5">
        <SectionTitle id="resources-heading">{type ? `${type} resources` : "All resources"}</SectionTitle>
        {resources.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {type
              ? `No ${type} resources have been added yet. Try another filter.`
              : "No resources have been added yet. Check back soon."}
          </p>
        ) : (
          <ul className="stagger-in grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <li key={resource.id} className="card-lift rounded-2xl border border-border bg-card p-5 shadow-sm">
                <span className="pill">{resource.type}</span>
                <h3 className="mt-3 font-heading text-2xl leading-tight tracking-wide">{resource.title}</h3>
                {resource.tags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {resource.tags.map((tag) => <span key={tag} className="pill">{tag}</span>)}
                  </div>
                ) : null}
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex max-w-full items-start gap-2 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ExternalLink aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span className="break-all">{resource.url}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
