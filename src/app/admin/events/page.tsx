import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = { title: "Events · Admin" };

export { AdminEventsPage as default } from "@/frontend/features/events/admin-events-page";
