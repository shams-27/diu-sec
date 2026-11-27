"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <h1 className="font-heading text-3xl tracking-wide">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">The page could not be loaded. Please try again.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Try again
        </button>
        <Link href="/" className="rounded-md border border-border px-4 py-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Back home
        </Link>
      </div>
    </div>
  );
}
