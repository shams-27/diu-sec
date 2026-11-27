import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about DIU SEC? Send a message to the club team.",
};

export { ContactPage as default } from "@/frontend/features/contact/contact-page";
