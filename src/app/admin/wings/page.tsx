import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = { title: "Wings & rosters · Admin" };

export { AdminWingsPage as default } from "@/frontend/features/wings/admin-wings-page";
