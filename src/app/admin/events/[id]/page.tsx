import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = { title: "Event registrations · Admin" };

export { AdminEventPage as default } from "@/frontend/features/events/admin-event-page";
