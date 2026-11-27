export default function Loading() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="h-10 w-1/2 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="h-24 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        ))}
      </div>
      <span className="sr-only">Loading admin data</span>
    </div>
  );
}
