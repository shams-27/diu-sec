import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join DIU SEC",
  description: "Apply for DIU SEC membership with your DIU SWE student ID and get an instant digital ID card.",
};

export { JoinPage as default } from "@/frontend/features/membership/join-page";
