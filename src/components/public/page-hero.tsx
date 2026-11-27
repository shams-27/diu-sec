export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="hero-surface relative overflow-hidden rounded-3xl border border-border px-6 py-10 sm:px-10 sm:py-14">
      <div className="dot-grid pointer-events-none absolute -right-10 -top-10 size-48 opacity-40" aria-hidden="true" />
      <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h1 className="relative mt-3 font-heading text-4xl leading-[1.05] tracking-wide sm:text-6xl">{title}</h1>
      {description ? (
        <p className="relative mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
      ) : null}
      {children ? <div className="relative mt-6">{children}</div> : null}
    </section>
  );
}

export function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="font-heading text-3xl tracking-wide sm:text-4xl">
      {children}
    </h2>
  );
}
