import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Magazine",
  description: "Issues and student articles from the DIU SEC magazine.",
};

export { MagazinePage as default } from "@/frontend/features/magazine/magazine-page";
