import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = { title: "Certificates · Admin" };

export { AdminCertificatesPage as default } from "@/frontend/features/certificates/admin-certificates-page";
