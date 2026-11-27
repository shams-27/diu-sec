import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from DIU SEC orientations, contests and tech fests.",
};

export { GalleryPage as default } from "@/frontend/features/gallery/gallery-page";
