import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = { title: "Members · Admin" };

export { AdminMembersPage as default } from "@/frontend/features/membership/admin-members-page";
