"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";

type GalleryPhoto = { id: string; url: string; caption?: string | null };

export function GalleryLightbox({ title, photos }: { title: string; photos: GalleryPhoto[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
    closeRef.current?.focus();
  }, [open]);

  if (photos.length === 0) return null;
  const photo = photos[index];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Images aria-hidden="true" className="size-4" />
        View {photos.length} {photos.length === 1 ? "photo" : "photos"}
      </button>
      <dialog
        ref={dialogRef}
        aria-label={`${title} photos`}
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            setIndex((current) => (current + 1) % photos.length);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            setIndex((current) => (current - 1 + photos.length) % photos.length);
          }
        }}
        className="w-[calc(100%-2rem)] max-w-3xl rounded-2xl border border-border bg-card p-4 text-foreground shadow-xl backdrop:bg-foreground/60 sm:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-2xl tracking-wide">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close gallery"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-background hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={photo.caption ?? `${title} photo ${index + 1}`}
            className="mx-auto max-h-[65vh] w-auto max-w-full rounded-xl border border-border object-contain"
          />
          <p className="mt-3 min-h-5 text-center text-sm text-muted-foreground">{photo.caption ?? ""}</p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIndex((current) => (current - 1 + photos.length) % photos.length)}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            Previous
          </button>
          <span className="text-sm font-medium text-primary tabular-nums">
            {index + 1} / {photos.length}
          </span>
          <button
            type="button"
            onClick={() => setIndex((current) => (current + 1) % photos.length)}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Next
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </dialog>
    </>
  );
}
