import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/backend/shared/auth";
import { AdminSidebar } from "@/frontend/shared/shell/admin-sidebar";

// Auth is per-request, so this shell blocks instead of prerendering.
export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Auth.js generates a CSRF token via crypto.getRandomValues when none is present.
  await connection();
  const session = await auth();
  if (!session?.user?.role) redirect("/");

  return (
    <div className="admin-surface public-brutal flex min-h-screen flex-col lg:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-banner flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="shrink-0 bg-transparent dark:bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sec_logo.png" alt="DIU SEC" width={82} height={40} className="h-10 w-auto" />
            </span>
            <div>
              <p className="font-heading text-xl leading-none tracking-wide">Administration</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">DIU SEC control room</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="pill">{session.user.role.replaceAll("_", " ")}</span>
            <Link
              href="/"
              className="rounded-md text-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
            >
              View site
            </Link>
          </div>
        </header>
        <main id="main" className="flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
