import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = { title: "Gallery · Admin" };

export { AdminGalleryPage as default } from "@/frontend/features/gallery/admin-gallery-page";
