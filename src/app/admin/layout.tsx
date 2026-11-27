import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

// Auth reads happen per request; the admin shell is intentionally blocking.
export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.role) redirect("/");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-muted-foreground">Administration</p>
          <Link href="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            View site
          </Link>
        </header>
        <main id="main" className="flex-1 px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
