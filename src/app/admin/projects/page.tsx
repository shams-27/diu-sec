import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = { title: "Projects · Admin" };

export { AdminProjectsPage as default } from "@/frontend/features/projects/admin-projects-page";
