import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = { title: "Magazine · Admin" };

export { AdminMagazinePage as default } from "@/frontend/features/magazine/admin-magazine-page";
