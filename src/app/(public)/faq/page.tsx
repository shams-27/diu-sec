import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about DIU SEC membership eligibility, labs and club activities.",
};

export { FaqPage as default } from "@/frontend/features/faq/faq-page";
