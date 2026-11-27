import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NEXT = [
  { href: "/join", title: "Become a member", body: "Apply with your DIU SWE student ID." },
  { href: "/events", title: "Explore events", body: "Workshops, courses and hackathons." },
  { href: "/verify", title: "Verify a certificate", body: "Check any DIU SEC credential." },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl border border-border bg-card p-8 text-center sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Daffodil International University
        </p>
        <h1 className="mt-3 font-heading text-5xl tracking-wide sm:text-6xl">Software Engineering Club</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          The home of DIU SWE students who build, compete and learn together. The full introduction arrives in
          Phase 8; the site structure is ready now.
        </p>
        <Link
          href="/join"
          className="mt-6 inline-block rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Join DIU SEC
        </Link>
      </section>

      <section aria-labelledby="next-heading">
        <h2 id="next-heading" className="font-heading text-3xl tracking-wide">
          Get started
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {NEXT.map((item) => (
            <Card key={item.href}>
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.body}</p>
                <Link href={item.href} className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Open
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="modules-heading">
        <h2 id="modules-heading" className="font-heading text-3xl tracking-wide">
          Explore the club
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Module pages will be filled in phase by phase. The navigation already links to all of them.
        </p>
      </section>
    </div>
  );
}
