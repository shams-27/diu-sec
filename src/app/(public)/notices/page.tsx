import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notices",
  description: "Recruitment, committee, contest and campus notices from DIU SEC.",
};

export { NoticesPage as default } from "@/frontend/features/notices/notices-page";
