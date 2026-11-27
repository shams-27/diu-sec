export default function Loading() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="h-10 w-2/3 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      <div className="h-4 w-full animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <span className="sr-only">Loading content</span>
    </div>
  );
}
