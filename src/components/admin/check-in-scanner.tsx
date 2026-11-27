"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { checkInAction, type CheckInState } from "@/server/actions/events";

const initial: CheckInState = {};

export function CheckInScanner({ eventId }: { eventId: string }) {
  const [state, formAction, pending] = useActionState(checkInAction, initial);
  const [token, setToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scanner = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);

  useEffect(() => {
    return () => {
      void scanner.current?.stop();
      scanner.current?.clear();
      scanner.current = null;
    };
  }, []);

  async function startScanner() {
    try {
      setCameraError(null);
      const { Html5Qrcode } = await import("html5-qrcode");
      const instance = new Html5Qrcode("qr-reader");
      scanner.current = instance;
      await instance.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 200 },
        (decodedText) => {
          setToken(decodedText);
          void stopScanner();
        },
        () => {},
      );
      setScanning(true);
    } catch {
      scanner.current?.clear();
      scanner.current = null;
      setCameraError("Camera access failed. Type the QR token manually instead.");
      setScanning(false);
    }
  }

  async function stopScanner() {
    try {
      await scanner.current?.stop();
    } finally {
      scanner.current?.clear();
      scanner.current = null;
      setScanning(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl tracking-wide">Scan a QR code</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Point the camera at a registration QR. The token is copied into the form; press Check in to confirm.
        </p>
        <div id="qr-reader" className="mt-4 min-h-48 overflow-hidden rounded-xl border border-border bg-muted" />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startScanner}
            disabled={scanning}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {scanning ? "Scanner running…" : "Start camera"}
          </button>
          {scanning ? (
            <button type="button" onClick={stopScanner} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Stop camera
            </button>
          ) : null}
        </div>
        {cameraError ? (
          <p role="alert" className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {cameraError}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl tracking-wide">Check in</h2>
        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="eventId" value={eventId} />
          <label className="block text-xs font-medium">
            QR token
            <input
              name="qrToken"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
              minLength={4}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {pending ? "Checking in…" : "Check in"}
          </button>
        </form>
        {state.error ? (
          <p role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        {state.checkedIn ? (
          <p role="status" className="mt-4 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
            Checked in: {state.checkedIn}
          </p>
        ) : null}
      </section>
    </div>
  );
}
