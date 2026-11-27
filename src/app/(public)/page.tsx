import type { Metadata } from "next";

export const metadata: Metadata = {
  description:
    "The Software Engineering Club at Daffodil International University. Build, compete and learn with 1,200+ members, hackathons, workshops and projects.",
};

export { HomePage as default } from "@/frontend/features/home/home-page";
