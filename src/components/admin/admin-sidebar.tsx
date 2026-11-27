"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  {
    label: "Overview",
    links: [{ href: "/admin", label: "A-01 Dashboard" }],
  },
  {
    label: "People",
    links: [
      { href: "/admin/members", label: "A-02 Members" },
      { href: "/admin/committee", label: "A-03 Committee" },
      { href: "/admin/wings", label: "A-04 Wings" },
    ],
  },
  {
    label: "Programmes",
    links: [
      { href: "/admin/events", label: "A-05 Events" },
      { href: "/admin/certificates", label: "A-06 Certificates" },
      { href: "/admin/magazine", label: "A-07 Magazine" },
      { href: "/admin/projects", label: "A-08 Projects" },
      { href: "/admin/hall-of-fame", label: "A-09 Hall of Fame" },
      { href: "/admin/notices", label: "A-10 Notices" },
    ],
  },
  {
    label: "Content & access",
    links: [
      { href: "/admin/resources", label: "A-11 Resources" },
      { href: "/admin/sponsors", label: "A-11 Sponsors" },
      { href: "/admin/gallery", label: "A-11 Gallery" },
      { href: "/admin/access", label: "A-12 Access" },
      { href: "/admin/audit", label: "A-12 Audit" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const links = (
    <nav aria-label="Admin navigation" className="space-y-4">
      {SECTIONS.map((section) => (
        <div key={section.label}>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section.label}</p>
          <ul className="mt-1 space-y-1">
            {section.links.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative block rounded-md px-3 py-2 text-sm transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <span aria-hidden="true" className="absolute inset-y-1 left-0 w-1 rounded-full bg-primary" />
                    )}
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <details className="border-b border-border bg-card p-3 lg:hidden">
        <summary className="cursor-pointer list-none rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Admin menu
        </summary>
        <div className="mt-2">{links}</div>
      </details>
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-4 lg:block">
        <div className="dot-grid mb-6 rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-heading text-3xl leading-none tracking-wide">DIU SEC</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-primary">Admin panel</p>
        </div>
        {links}
      </aside>
    </>
  );
}
