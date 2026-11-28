import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = { title: "Notice board · Admin" };

export { AdminNoticesPage as default } from "@/frontend/features/notices/admin-notices-page";
