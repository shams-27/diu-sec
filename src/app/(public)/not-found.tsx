import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <h1 className="font-heading text-4xl tracking-wide">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">That page does not exist or has moved.</p>
      <Link href="/" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Back home
      </Link>
    </div>
  );
}
