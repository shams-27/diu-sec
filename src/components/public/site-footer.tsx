import Link from "next/link";

const GROUPS = [
  [
    { href: "/committee", label: "Committee" },
    { href: "/wings", label: "Wings" },
    { href: "/join", label: "Membership" },
    { href: "/events", label: "Events" },
  ],
  [
    { href: "/magazine", label: "Magazine" },
    { href: "/hall-of-fame", label: "Hall of Fame" },
    { href: "/projects", label: "Projects" },
    { href: "/verify", label: "Verify Certificate" },
  ],
  [
    { href: "/notices", label: "Notices" },
    { href: "/resources", label: "Resources" },
    { href: "/partners", label: "Partners" },
    { href: "/gallery", label: "Gallery" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ],
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-heading text-3xl tracking-wide">DIU SEC</p>
          <p className="eyebrow mt-1">Software Engineering Club</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Daffodil International University · Department of Software Engineering.
          </p>
        </div>
        {GROUPS.map((group, i) => (
          <nav key={i} aria-label={`Footer links ${i + 1}`}>
            <ul className="space-y-2 text-sm">
              {group.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-underline rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © DIU SEC. All rights reserved.
      </div>
    </footer>
  );
}
