import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events & courses",
  description: "DIU SEC hackathons, workshops and multi-week skill courses.",
};

export { EventsPage as default } from "@/frontend/features/events/events-page";
