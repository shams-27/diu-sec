import { getPublicAlbums } from "@/backend/features/gallery/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { Images } from "lucide-react";
import { connection } from "next/server";
import { GalleryLightbox } from "@/components/public/gallery-lightbox";
import { PageHero, SectionTitle } from "@/frontend/shared/page-hero";
import { ALBUM_CATEGORIES, galleryFilterSchema } from "@/backend/shared/validators";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from DIU SEC orientations, contests and tech fests.",
};

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? (value[0] ?? "") : (value ?? "")]),
  );
  const parsed = galleryFilterSchema.safeParse(flat);
  const category = parsed.success ? parsed.data.category : undefined;
  const albums = await getPublicAlbums(category);

  const chipClass = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
    }`;

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Moments"
        title="Gallery"
        description="A look back at our orientations, contests and tech fests — open an album to browse every photo."
      />

      <nav aria-label="Album categories" className="flex flex-wrap gap-2">
        <Link href="/gallery" aria-current={category === undefined ? "page" : undefined} className={chipClass(category === undefined)}>
          All
        </Link>
        {ALBUM_CATEGORIES.map((value) => (
          <Link
            key={value}
            href={`/gallery?category=${value}`}
            aria-current={category === value ? "page" : undefined}
            className={chipClass(category === value)}
          >
            {value}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="albums-heading" className="space-y-5">
        <SectionTitle id="albums-heading">{category ? `${category} albums` : "All albums"}</SectionTitle>
        {albums.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {category
              ? `No ${category} albums have been added yet. Try another filter.`
              : "No albums have been added yet. Check back soon."}
          </p>
        ) : (
          <ul className="stagger-in grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => {
              const cover = album.coverUrl ?? album.photos[0]?.url;
              return (
                <li key={album.id} className="card-lift overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="grid aspect-video place-items-center bg-muted">
                      <Images aria-hidden="true" className="size-10 text-primary" />
                    </div>
                  )}
                  <div className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="pill">{album.category}</span>
                      <span className="text-xs font-medium text-muted-foreground tabular-nums">
                        {album.photos.length} {album.photos.length === 1 ? "photo" : "photos"}
                      </span>
                    </div>
                    <h3 className="font-heading text-2xl leading-tight tracking-wide">{album.title}</h3>
                    <GalleryLightbox title={album.title} photos={album.photos} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
