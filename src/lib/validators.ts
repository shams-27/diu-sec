import { z } from "zod";

/** DIU SWE student ID: XXX-35-XXX (35 = SWE dept code). Adjust here ONLY. */
export const STUDENT_ID_REGEX = /^\d{3}-35-\d{3,4}$/;
export const DIU_EMAIL_DOMAIN = "diu.edu.bd";
export const CERT_ID_REGEX = /^DIU-SEC-CERT-[0-9A-Z]{4,}$/;
export const GITHUB_REPO_REGEX = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_BYTES = 25 * 1024 * 1024;
export const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

export const studentIdSchema = z
  .string()
  .trim()
  .regex(STUDENT_ID_REGEX, "Use your DIU SWE ID, e.g. 221-35-123");

export const diuEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .refine((e) => e.endsWith(`@${DIU_EMAIL_DOMAIN}`), `Email must end with @${DIU_EMAIL_DOMAIN}`);

export const certIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(CERT_ID_REGEX, "Invalid certificate ID");

export const githubRepoSchema = z
  .string()
  .trim()
  .regex(GITHUB_REPO_REGEX, "Must be a github.com/owner/repo URL");

export const memberApplicationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  studentId: studentIdSchema,
  email: diuEmailSchema,
  batch: z.string().trim().max(10).optional(),
  phone: z.string().trim().max(20).optional(),
  wingPrefId: z.string().cuid().optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  message: z.string().trim().min(10).max(2000),
});

/** Cert ID: prefix + 6 chars, no ambiguous characters (0/O, 1/I). */
const CERT_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateCertId(len = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let s = "";
  for (const b of bytes) s += CERT_ALPHABET[b % CERT_ALPHABET.length];
  return `DIU-SEC-CERT-${s}`;
}
