import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wings",
  description: "The five engineering wings of DIU SEC and the students who lead them.",
};

export { WingsPage as default } from "@/frontend/features/wings/wings-page";
