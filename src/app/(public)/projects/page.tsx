import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ExternalLink, GitBranch } from "lucide-react";
import { PageHero, SectionTitle } from "@/components/public/page-hero";
import { db } from "@/lib/db";
import { projectFilterSchema } from "@/lib/validators";

export const metadata: Metadata = {
  title: "Projects",
  description: "Open-source and client projects built by DIU SEC members.",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? (value[0] ?? "") : (value ?? "")]),
  );
  const parsed = projectFilterSchema.safeParse(flat);
  const tag = parsed.success ? parsed.data.tag : undefined;
  const projects = await db.project.findMany({
    where: { status: "APPROVED" },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      githubUrl: true,
      demoUrl: true,
      techStack: true,
      contributors: true,
      tags: true,
      featured: true,
    },
  });
  const chips = [...new Set(projects.flatMap((project) => [...project.tags, ...project.techStack]))].sort();
  const visible = tag ? projects.filter((project) => project.tags.includes(tag) || project.techStack.includes(tag)) : projects;

  const chipClass = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
    }`;

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Built by SEC"
        title="Projects"
        description="Tools, apps and experiments from the club — browse by tag or technology and explore the code."
      />

      <nav aria-label="Project tags" className="flex flex-wrap gap-2">
        <Link href="/projects" aria-current={tag === undefined ? "page" : undefined} className={chipClass(tag === undefined)}>
          All
        </Link>
        {chips.map((value) => (
          <Link
            key={value}
            href={`/projects?tag=${encodeURIComponent(value)}`}
            aria-current={tag === value ? "page" : undefined}
            className={chipClass(tag === value)}
          >
            {value}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="projects-heading" className="space-y-5">
        <SectionTitle id="projects-heading">{tag ? `Projects tagged ${tag}` : "Featured and recent projects"}</SectionTitle>
        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {projects.length === 0
              ? "No approved projects have been published yet. Check back soon."
              : `No approved projects match ${tag}. Try another filter.`}
          </p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {visible.map((project) => (
              <li key={project.id} className="card-lift rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {project.featured ? <span className="pill border-primary/40 text-primary">Featured</span> : null}
                  {project.tags.map((value) => <span key={value} className="pill">{value}</span>)}
                </div>
                <h3 className="mt-4 font-heading text-2xl leading-tight tracking-wide">{project.title}</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{project.description}</p>
                <div className="mt-4 space-y-2">
                  {project.techStack.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech) => <span key={tech} className="pill">{tech}</span>)}
                    </div>
                  ) : null}
                  {project.contributors.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      By {project.contributors.join(", ")}
                    </p>
                  ) : null}
                </div>
                <div className="mt-5 flex flex-wrap gap-4">
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <GitBranch aria-hidden="true" className="size-4" />
                    Source code
                  </a>
                  {project.demoUrl ? (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ExternalLink aria-hidden="true" className="size-4" />
                      Live demo
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
