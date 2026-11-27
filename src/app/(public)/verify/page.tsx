import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description: "Check the validity of a DIU SEC certificate by its certificate ID.",
};

export { VerifyPage as default } from "@/frontend/features/certificates/verify-page";
