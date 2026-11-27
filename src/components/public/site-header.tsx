import Link from "next/link";

const LINKS = [
  { href: "/committee", label: "Committee" },
  { href: "/wings", label: "Wings" },
  { href: "/events", label: "Events" },
  { href: "/verify", label: "Verify" },
];

const linkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2 font-heading text-2xl tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span
            aria-hidden="true"
            className="size-4 rotate-45 rounded-[3px] bg-primary transition-transform duration-200 group-hover:rotate-[225deg] motion-reduce:transition-none"
          />
          DIU SEC
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
          <Link
            href="/join"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Join the club
          </Link>
        </nav>
        <details className="relative md:hidden">
          <summary className="cursor-pointer list-none rounded-md border border-border px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Menu
          </summary>
          <nav
            aria-label="Mobile navigation"
            className="absolute right-0 top-full z-50 mt-2 flex w-48 flex-col rounded-lg border border-border bg-card p-2 shadow-lg"
          >
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
            <Link href="/join" className={linkClass}>
              Join the club
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
