import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Open-source and client projects built by DIU SEC members.",
};

export { ProjectsPage as default } from "@/frontend/features/projects/projects-page";
