import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CheckInScanner } from "@/components/admin/check-in-scanner";
import { requireActor } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "QR check-in · Admin" };

export default async function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const actor = await requireActor("events", "write", "own");
  const { id } = await params;
  const event = await db.event.findFirst({
    where: { id, ...(actor.role === "WING_LEAD" ? { wingId: actor.wingId } : {}) },
    select: { id: true, title: true },
  });
  if (!event) notFound();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">A-05 · Attendance</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide">Check-in: {event.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Scan a QR or paste its token. Double check-ins are blocked.</p>
        <Link
          href={`/admin/events/${event.id}`}
          className="mt-4 inline-block rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          ← Registrations
        </Link>
      </div>
      <CheckInScanner eventId={event.id} />
    </div>
  );
}
