export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-[1440px] px-6 py-10 sm:px-10 lg:px-16">
        <span className="inline-block rounded-sm bg-transparent dark:bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sec_logo.png" alt="DIU SEC" width={82} height={40} className="h-10 w-auto" />
        </span>
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
