import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { PageHero } from "@/frontend/shared/page-hero";
import { certIdSchema } from "@/backend/shared/validators";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description: "Check the validity of a DIU SEC certificate by its certificate ID.",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const raw = await searchParams;
  const value = Array.isArray(raw.certId) ? raw.certId[0] : raw.certId;
  if (value) {
    const parsed = certIdSchema.safeParse(value);
    if (parsed.success) redirect(`/verify/${parsed.data}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHero
        eyebrow="Trust, verified"
        title="Check a certificate"
        description="Every DIU SEC certificate carries a unique ID and a QR code. Enter the ID below to see its current status."
      />

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <form action="/verify" method="get" className="space-y-4">
          <label className="block text-xs font-medium">
            Certificate ID
            <input
              name="certId"
              defaultValue={typeof value === "string" ? value : ""}
              placeholder="DIU-SEC-CERT-A1B2C3"
              required
              className={inputClass}
            />
          </label>
          {value ? (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              That ID does not match the DIU SEC certificate format.
            </p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Verify certificate
          </button>
        </form>
        <p className="mt-4 text-xs text-muted-foreground">
          Format: <code className="font-mono">DIU-SEC-CERT-</code> followed by at least four letters or digits.
        </p>
      </section>
    </div>
  );
}
