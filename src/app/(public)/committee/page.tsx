import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Executive Committee",
  description: "Meet the executive committee behind DIU SEC, organized by session.",
};

export { CommitteePage as default } from "@/frontend/features/committee/committee-page";
