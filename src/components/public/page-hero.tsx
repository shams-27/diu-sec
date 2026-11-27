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
    <section className="hero-surface rise-in relative overflow-hidden rounded-3xl border border-border px-6 py-10 sm:px-10 sm:py-14">
      <div className="dot-grid pointer-events-none absolute -right-10 -top-10 size-48 opacity-40" aria-hidden="true" />
      <p className="eyebrow relative">{eyebrow}</p>
      <h1 className="page-title relative mt-3">{title}</h1>
      {description ? <p className="lead-text relative mt-4">{description}</p> : null}
      {children ? <div className="relative mt-6">{children}</div> : null}
    </section>
  );
}

export function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="section-title">
      {children}
    </h2>
  );
}
