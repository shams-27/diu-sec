export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-[1440px] px-6 py-10 sm:px-10 lg:px-16">
        <p className="font-heading text-3xl tracking-wide">DIU SEC</p>
        <p className="eyebrow mt-1">Software Engineering Club</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Daffodil International University · Department of Software Engineering.
        </p>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © DIU SEC. All rights reserved.
      </div>
    </footer>
  );
}
