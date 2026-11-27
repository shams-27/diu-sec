"use client";

import { useRef } from "react";

export function SyllabusDialog({ syllabus }: { syllabus: string }) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        View syllabus
      </button>
      <dialog
        ref={dialog}
        aria-label="Event syllabus"
        className="w-[min(92vw,640px)] rounded-2xl border border-border bg-card p-6 text-foreground shadow-xl backdrop:bg-foreground/40"
      >
        <h2 className="font-heading text-2xl tracking-wide">Syllabus</h2>
        <pre className="mt-4 max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-4 text-sm">
          {syllabus}
        </pre>
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Close
        </button>
      </dialog>
    </>
  );
}
