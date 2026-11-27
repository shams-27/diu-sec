import { getCertificateAdminData } from "@/backend/features/certificates/queries";
import Link from "next/link";
import { connection } from "next/server";
import { requireActor } from "@/backend/shared/admin-guard";
import { issueCertificatesAction, revokeCertificateAction } from "@/backend/features/certificates/certificates";



const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
export async function AdminCertificatesPage() {
  await connection();
  const actor = await requireActor("certificates", "read", "own");
  const [certificates, events] = await getCertificateAdminData(actor.role === "WING_LEAD" ? actor.wingId : undefined);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">A-06</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide">Certification engine</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Issue unique, verifiable certificates in bulk and revoke them instantly.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl tracking-wide">Issue certificates</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One recipient per line: <code className="font-mono">Name, email</code>. Each certificate gets its own PDF and verification URL.
        </p>
        <form action={issueCertificatesAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">Type
            <select name="type" defaultValue="PARTICIPANT" className={inputClass}>
              <option value="PARTICIPANT">Participant</option>
              <option value="WINNER">Winner</option>
              <option value="EXECUTIVE">Executive</option>
              <option value="COURSE">Course</option>
            </select>
          </label>
          <label className="text-xs font-medium">Event
            <select name="eventId" required={actor.role === "WING_LEAD"} className={inputClass}>
              <option value="">No event</option>
              {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            Recipients
            <textarea
              name="recipients"
              required
              rows={5}
              placeholder={"Jane Doe, jane@diu.edu.bd\nJohn Roe, john@diu.edu.bd"}
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2"
          >
            Issue certificates
          </button>
        </form>
      </section>

      {certificates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No certificates in your scope yet. Issue the first one above.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide">
              <tr>
                <th scope="col" className="px-3 py-2">Certificate</th>
                <th scope="col" className="px-3 py-2">Recipient</th>
                <th scope="col" className="px-3 py-2">Type</th>
                <th scope="col" className="px-3 py-2">Event</th>
                <th scope="col" className="px-3 py-2">Issued</th>
                <th scope="col" className="px-3 py-2">Status</th>
                <th scope="col" className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert) => (
                <tr key={cert.id} className="border-t border-border align-top">
                  <td className="px-3 py-2">
                    <Link href={`/verify/${cert.certId}`} className="font-mono text-xs text-primary underline-offset-4 hover:underline">
                      {cert.certId}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{cert.recipientName}<span className="block text-xs text-muted-foreground">{cert.recipientEmail ?? "—"}</span></td>
                  <td className="px-3 py-2">{cert.type.replace("_", " ")}</td>
                  <td className="px-3 py-2">{cert.event?.title ?? "—"}</td>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">
                    {cert.issuedAt.toLocaleDateString("en-GB", { timeZone: "UTC" })}
                  </td>
                  <td className="px-3 py-2"><span className={`pill ${cert.status === "REVOKED" ? "border-destructive/40 text-destructive" : ""}`}>{cert.status}</span></td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {cert.pdfUrl ? <a href={cert.pdfUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary underline-offset-4 hover:underline">PDF ↗</a> : null}
                      {cert.status === "VALID" ? (
                        <form action={revokeCertificateAction} className="flex items-center gap-2">
                          <input type="hidden" name="certId" value={cert.certId} />
                          <input
                            name="reason"
                            maxLength={300}
                            aria-label={`Reason for revoking ${cert.certId}`}
                            placeholder="Reason (optional)"
                            className="w-24 rounded-md border border-border bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-40"
                          />
                          <button type="submit" className="text-xs font-semibold text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Revoke</button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
