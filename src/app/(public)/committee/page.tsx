import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PageHero, SectionTitle } from "@/frontend/shared/page-hero";
import { db } from "@/backend/shared/db";
import { sessionFilterSchema } from "@/backend/shared/validators";

export const metadata: Metadata = {
  title: "Executive Committee",
  description: "Meet the executive committee behind DIU SEC, organized by session.",
};

function socialLinks(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>)
    .filter(([, url]) => typeof url === "string" && url.startsWith("http"))
    .map(([label, url]) => ({ label, url: url as string }));
}

export default async function CommitteePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? (value[0] ?? "") : (value ?? "")]),
  );
  const parsed = sessionFilterSchema.safeParse(flat);
  const sessions = await db.execSession.findMany({ orderBy: { year: "desc" } });
  const selected =
    sessions.find((session) => session.year === (parsed.success ? parsed.data.year : undefined)) ??
    sessions.find((session) => session.isCurrent) ??
    sessions[0];
  const members = selected
    ? await db.committeeMember.findMany({ where: { sessionId: selected.id }, orderBy: { order: "asc" } })
    : [];

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Leadership"
        title="Executive committee"
        description="The students who plan the sessions, run the wings and keep every club programme moving. Browse the team by year."
      />

      <section aria-labelledby="sessions-heading" className="space-y-4">
        <SectionTitle id="sessions-heading">Browse sessions</SectionTitle>
        {sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No committee sessions have been published yet.
          </p>
        ) : (
          <nav aria-label="Committee sessions" className="flex flex-wrap gap-2">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/committee?year=${session.year}`}
                aria-current={selected?.id === session.id ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selected?.id === session.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                {session.year}
                {session.isCurrent ? " · current" : ""}
              </Link>
            ))}
          </nav>
        )}
      </section>

      <section aria-labelledby="members-heading" className="space-y-5">
        <div>
          <SectionTitle id="members-heading">
            {selected ? `${selected.label} (${selected.year})` : "Committee members"}
          </SectionTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            {members.length} {members.length === 1 ? "member" : "members"} in this panel.
          </p>
        </div>
        {members.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No committee members have been added to this session yet.
          </p>
        ) : (
          <ul className="stagger-in grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <li
                key={member.id}
                className="card-lift rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  {member.photoUrl ? (
                    // Portrait URLs are validated on upload; plain img keeps this server component cheap.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.photoUrl}
                      alt=""
                      className="size-16 rounded-xl border border-border object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="grid size-16 shrink-0 place-items-center rounded-xl bg-muted font-heading text-2xl text-primary"
                    >
                      {member.name.slice(0, 1)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-heading text-xl leading-tight">{member.name}</p>
                    <p className="mt-1 text-sm font-semibold text-primary">{member.title}</p>
                    {member.batch ? (
                      <p className="mt-1 text-xs text-muted-foreground">Batch {member.batch}</p>
                    ) : null}
                  </div>
                </div>
                {socialLinks(member.socialLinks).length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                    {socialLinks(member.socialLinks).map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {link.label} ↗
                      </a>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
