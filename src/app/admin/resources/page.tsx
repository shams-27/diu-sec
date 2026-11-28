import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = { title: "Resources · Admin" };

export { AdminResourcesPage as default } from "@/frontend/features/resources/admin-resources-page";
