import Link from "next/link";
import { SiteNavDrawer } from "./site-nav-drawer";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3 sm:px-10 lg:px-16">
        <div className="flex items-center gap-3">
          <SiteNavDrawer />
          <Link href="/" className="group flex items-center gap-2 font-heading text-2xl tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span
              aria-hidden="true"
              className="size-4 rotate-45 rounded-[3px] bg-primary transition-transform duration-200 group-hover:rotate-[225deg] motion-reduce:transition-none"
            />
            DIU SEC
          </Link>
        </div>
        <Link
          href="/join"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Join Now
        </Link>
      </div>
    </header>
  );
}
