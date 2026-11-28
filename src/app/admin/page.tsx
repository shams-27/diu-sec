import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = { title: "Dashboard · Admin" };

export { DashboardPage as default } from "@/frontend/features/dashboard/dashboard-page";
