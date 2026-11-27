import { getCertificateByCertId } from "@/backend/features/certificates/queries";
import Link from "next/link";
import { connection } from "next/server";
import { CheckCircle2, ShieldX } from "lucide-react";
import { PageHero, SectionTitle } from "@/frontend/shared/page-hero";
import { certIdSchema } from "@/backend/shared/validators";



export async function CertificatePage({ params }: { params: Promise<{ certId: string }> }) {
  await connection();
  const { certId: raw } = await params;
  const parsed = certIdSchema.safeParse(raw);
  const cert = parsed.success
    ? await getCertificateByCertId(parsed.data)
    : null;

  if (!cert) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <PageHero eyebrow="Verification result" title="Certificate not found" description={`No DIU SEC certificate matches “${raw}”. Check the ID and try again.`}>
          <Link href="/verify" className="inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Try another ID
          </Link>
        </PageHero>
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Issued certificates appear here as soon as an officer publishes them.
        </p>
      </div>
    );
  }

  const valid = cert.status === "VALID";
  const StatusIcon = valid ? CheckCircle2 : ShieldX;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHero
        eyebrow="Verification result"
        title={valid ? "This certificate is valid" : "This certificate is revoked"}
        description="Issued by the Software Engineering Club, Daffodil International University."
      />

      <section aria-labelledby="status-heading" className="space-y-5">
        <SectionTitle id="status-heading">Certificate details</SectionTitle>
        <div className={`rounded-2xl border p-6 ${valid ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5"}`}>
          <div className="flex items-start gap-3">
            <StatusIcon aria-hidden="true" className={`mt-0.5 size-7 shrink-0 ${valid ? "text-primary" : "text-destructive"}`} />
            <div>
              <p className={`font-heading text-2xl tracking-wide ${valid ? "text-primary" : "text-destructive"}`}>
                {valid ? "VALID" : "REVOKED"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {valid
                  ? "The certificate has not been revoked."
                  : `Revoked${cert.revokedAt ? ` on ${cert.revokedAt.toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" })}` : ""}${cert.revokeReason ? ` — ${cert.revokeReason}` : ""}.`}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recipient</dt>
              <dd className="mt-1 font-medium">{cert.recipientName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Certificate ID</dt>
              <dd className="mt-1 font-mono text-sm">{cert.certId}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Type</dt>
              <dd className="mt-1">{cert.type.replace("_", " ")}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Issued</dt>
              <dd className="mt-1 tabular-nums">
                {cert.issuedAt.toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "UTC" })}
              </dd>
            </div>
            {cert.event ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Event</dt>
                <dd className="mt-1">{cert.event.title}</dd>
              </div>
            ) : null}
          </dl>

          {cert.pdfUrl && valid ? (
            <a
              href={cert.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Download PDF ↗
            </a>
          ) : null}
        </div>
        <Link href="/verify" className="inline-block rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          ← Verify another certificate
        </Link>
      </section>
    </div>
  );
}
