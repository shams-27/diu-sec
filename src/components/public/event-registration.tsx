"use client";

import { useActionState } from "react";
import { registerForEventAction, type RegistrationState } from "@/server/actions/events";

const initial: RegistrationState = {};
const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function EventRegistration({ eventId }: { eventId: string }) {
  const [state, formAction, pending] = useActionState(registerForEventAction, initial);

  if (state.qrDataUrl) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-sm font-semibold text-primary">Seat reserved</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={state.qrDataUrl}
          alt="QR code for event check-in"
          className="mx-auto mt-4 size-48 rounded-xl border border-border bg-white p-2"
        />
        <p className="mt-4 break-all font-mono text-xs text-muted-foreground">{state.qrToken}</p>
        <p className="mt-2 text-sm text-muted-foreground">Show this QR code at the check-in desk.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <input type="hidden" name="eventId" value={eventId} />
      <h2 className="font-heading text-2xl tracking-wide">Reserve your seat</h2>
      <label className="block text-xs font-medium">Full name <input name="name" required minLength={2} className={inputClass} /></label>
      <label className="block text-xs font-medium">Email <input name="email" type="email" required className={inputClass} /></label>
      {state.error ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        {pending ? "Reserving…" : "Reserve seat"}
      </button>
    </form>
  );
}
