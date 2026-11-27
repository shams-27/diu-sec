"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const PUBLIC_NAV_GROUPS = [
  {
    title: "Explore",
    links: [
      { href: "/committee", label: "Committee" },
      { href: "/wings", label: "Wings" },
      { href: "/join", label: "Membership" },
      { href: "/events", label: "Events" },
      { href: "/magazine", label: "Magazine" },
      { href: "/hall-of-fame", label: "Hall of Fame" },
      { href: "/projects", label: "Projects" },
    ],
  },
  {
    title: "Service",
    links: [
      { href: "/verify", label: "Verify Certificate" },
      { href: "/notices", label: "Notices" },
      { href: "/resources", label: "Resources" },
      { href: "/partners", label: "Partners" },
      { href: "/gallery", label: "Gallery" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

const linkClass =
  "link-underline block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SiteNavDrawer() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          dialogRef.current?.showModal();
          setOpen(true);
        }}
        className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Menu
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Quick links"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="nav-drawer fixed inset-y-0 left-0 right-auto m-0 h-dvh w-[min(20rem,90vw)] max-w-none border-r border-border bg-card p-0 text-card-foreground shadow-xl"
      >
        <div className="flex h-full flex-col gap-6 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-heading text-3xl tracking-wide">Quick links</h2>
            <button
              type="button"
              aria-label="Close quick links"
              onClick={close}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Close
            </button>
          </div>
          <nav aria-label="Quick links" className="flex-1 space-y-6 overflow-y-auto">
            {PUBLIC_NAV_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="eyebrow mb-2">{group.title}</p>
                <div className="space-y-1">
                  {group.links.map((link) => (
                    <Link key={link.href} href={link.href} onClick={close} className={linkClass}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </dialog>
    </>
  );
}
