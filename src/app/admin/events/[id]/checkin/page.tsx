import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = { title: "QR check-in · Admin" };

export { CheckinPage as default } from "@/frontend/features/events/checkin-page";
