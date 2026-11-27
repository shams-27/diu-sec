export default function Loading() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="h-10 w-1/3 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      <div className="h-24 w-full animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      <div className="h-48 w-full animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      <span className="sr-only">Loading audit log</span>
    </div>
  );
}
