import type { Metadata } from "next";
import { Images } from "lucide-react";
import { connection } from "next/server";
import { requireActor } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { ALBUM_CATEGORIES } from "@/lib/validators";
import { addGalleryPhotoAction, saveGalleryAlbumAction } from "@/server/actions/gallery";

export const metadata: Metadata = { title: "Gallery · Admin" };

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const buttonClass =
  "rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primaryButtonClass =
  "w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const summaryClass =
  "cursor-pointer text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function GalleryAdminPage() {
  await connection();
  await requireActor("gallery", "read");
  const albums = await db.galleryAlbum.findMany({
    orderBy: { createdAt: "desc" },
    include: { photos: { orderBy: { order: "asc" } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">A-11</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide">Gallery</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create categorized albums and add photos from club events and tech fests.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 card-lift sm:p-5">
        <h2 className="font-heading text-2xl tracking-wide">New album</h2>
        <form action={saveGalleryAlbumAction} encType="multipart/form-data" className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">
            Title
            <input name="title" required minLength={3} maxLength={150} className={inputClass} />
          </label>
          <label className="text-xs font-medium">
            Category
            <select name="category" defaultValue="ORIENTATION" className={inputClass}>
              {ALBUM_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            Cover image (optional)
            <input name="cover" type="file" accept="image/jpeg,image/png,image/webp" className={inputClass} />
          </label>
          <button type="submit" className={`${primaryButtonClass} sm:col-span-2`}>Create album</button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-heading text-2xl tracking-wide">
          <Images aria-hidden className="h-5 w-5 text-primary" />
          Albums
        </h2>
        {albums.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No albums yet. Create the first one above.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {albums.map((album) => (
              <article key={album.id} className="min-w-0 rounded-2xl border border-border bg-card p-4 card-lift sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="break-words font-heading text-2xl tracking-wide">{album.title}</h3>
                  <span className="pill">{album.category}</span>
                </div>
                {album.coverUrl ? (
                  <a href={album.coverUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    View cover image
                  </a>
                ) : null}

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Photos ({album.photos.length})
                  </p>
                  {album.photos.length === 0 ? (
                    <p className="mt-2 rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      No photos in this album yet.
                    </p>
                  ) : (
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                      {album.photos.map((photo, index) => (
                        <li key={photo.id} className="min-w-0 rounded-lg border border-border p-2 text-xs">
                          <a href={photo.url} target="_blank" rel="noreferrer" className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            Photo {index + 1}
                          </a>
                          <span className="pill ml-2">#{photo.order}</span>
                          {photo.caption ? <p className="mt-1 break-words text-muted-foreground">{photo.caption}</p> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                  <details className="mt-3">
                    <summary className={summaryClass}>Add a photo</summary>
                    <form action={addGalleryPhotoAction} encType="multipart/form-data" className="mt-3 grid gap-2 sm:grid-cols-2">
                      <input type="hidden" name="albumId" value={album.id} />
                      <label className="text-xs font-medium sm:col-span-2">
                        Photo
                        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required className={inputClass} />
                      </label>
                      <label className="text-xs font-medium">
                        Caption (optional)
                        <input name="caption" maxLength={200} className={inputClass} />
                      </label>
                      <label className="text-xs font-medium">
                        Order
                        <input name="order" type="number" min={0} max={9999} defaultValue={album.photos.length} className={inputClass} />
                      </label>
                      <button type="submit" className={`${buttonClass} sm:col-span-2`}>Add photo</button>
                    </form>
                  </details>
                </div>

                <details className="mt-4 border-t border-border pt-3">
                  <summary className={summaryClass}>Edit album</summary>
                  <form action={saveGalleryAlbumAction} encType="multipart/form-data" className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input type="hidden" name="id" value={album.id} />
                    {album.coverUrl ? <input type="hidden" name="coverUrl" value={album.coverUrl} /> : null}
                    <label className="text-xs font-medium">
                      Title
                      <input name="title" defaultValue={album.title} required className={inputClass} />
                    </label>
                    <label className="text-xs font-medium">
                      Category
                      <select name="category" defaultValue={album.category} className={inputClass}>
                        {ALBUM_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </label>
                    <label className="text-xs font-medium sm:col-span-2">
                      Cover image (optional)
                      <input name="cover" type="file" accept="image/jpeg,image/png,image/webp" className={inputClass} />
                    </label>
                    <p className="text-xs text-muted-foreground sm:col-span-2">The current cover is kept unless you choose a new file.</p>
                    <button type="submit" className={`${buttonClass} sm:col-span-2`}>Save album</button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
