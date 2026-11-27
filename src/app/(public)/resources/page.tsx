import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources",
  description: "CP sheets, roadmaps, GitHub repos and interview guides curated by DIU SEC.",
};

export { ResourcesPage as default } from "@/frontend/features/resources/resources-page";
