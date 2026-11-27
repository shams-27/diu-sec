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

/** Shared institutional-domain check for the Auth.js sign-in callback. */
export function isDiuEmail(email: unknown): boolean {
  return typeof email === "string" && diuEmailSchema.safeParse(email).success;
}

export const certIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(CERT_ID_REGEX, "Invalid certificate ID");

export const githubRepoSchema = z
  .string()
  .trim()
  .regex(GITHUB_REPO_REGEX, "Must be a github.com/owner/repo URL");

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export type SubmitState = { error?: string; memberId?: string };

export const memberApplicationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  studentId: studentIdSchema,
  email: diuEmailSchema,
  batch: z.preprocess(emptyToUndefined, z.string().trim().max(10).optional()),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(20).optional()),
  wingPrefId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
});

export const memberReviewSchema = z.object({
  memberId: z.string().cuid(),
  decision: z.enum(["APPROVE", "REJECT", "REVOKE", "REISSUE"]),
});

export const memberFilterSchema = z.object({
  status: z.preprocess(emptyToUndefined, z.enum(["PENDING", "APPROVED", "REJECTED", "REVOKED"]).optional()),
  wingPrefId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
});

const emptyToNull = (value: unknown) => (value === "" ? null : value);

/** Exclusive upper bound for a UTC date-picker value. */
export function nextUtcMidnight(date: Date): Date {
  return new Date(date.getTime() + 86_400_000);
}

export const roleAssignmentSchema = z.object({
  userId: z.string().min(1),
  role: z.preprocess(
    emptyToNull,
    z.enum(["SUPER_ADMIN", "GENERAL_SECRETARY", "WING_LEAD", "PUBLICATION_EDITOR"]).nullable(),
  ),
  wingId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

export const auditFilterSchema = z.object({
  action: z.preprocess(
    emptyToUndefined,
    z.enum(["CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT", "REVOKE", "REISSUE", "PUBLISH", "LOGIN", "EXPORT"]).optional(),
  ),
  entity: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  email: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  from: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  to: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
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

const parseJson = (value: unknown) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

/** datetime-local has no zone; treat admin entries as UTC so forms round-trip. */
const DATE_TIME_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;
export const utcDateTimeSchema = z.preprocess(
  (value) => (typeof value === "string" && DATE_TIME_LOCAL.test(value) ? `${value}Z` : value),
  z.coerce.date(),
);

/** Links are rendered as href/src, so only web URLs and local uploads are safe. */
const httpUrl = z.string().url().refine((url) => /^https?:\/\//i.test(url), "Use an http(s) URL");
const photoUrlSchema = z.string().max(500).refine(
  (url) => /^https?:\/\//i.test(url) || /^\/uploads\/[\w.-]+$/.test(url),
  "Use an http(s) URL or a local upload",
);

// ───────── Committee & sessions (Phase 3) ─────────
export const sessionCreateSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  label: z.string().trim().min(2).max(100),
});

export const sessionActionSchema = z.object({
  sessionId: z.string().cuid(),
  decision: z.enum(["ARCHIVE", "UNARCHIVE", "SET_CURRENT"]),
});

export const committeeMemberSchema = z.object({
  id: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
  sessionId: z.string().cuid(),
  name: z.string().trim().min(2).max(100),
  title: z.string().trim().min(2).max(100),
  batch: z.preprocess(emptyToUndefined, z.string().trim().max(10).optional()),
  photoUrl: z.preprocess(emptyToUndefined, photoUrlSchema.optional()),
  socialLinks: z.preprocess(parseJson, z.record(httpUrl).optional()),
  order: z.coerce.number().int().min(0).max(1000),
});

export const committeeDeleteSchema = z.object({ id: z.string().cuid() });

export const committeeReorderSchema = z.object({
  sessionId: z.string().cuid(),
  ids: z.preprocess(parseJson, z.array(z.string().cuid()).min(1)),
});

export const sessionFilterSchema = z.object({
  year: z.preprocess(emptyToUndefined, z.coerce.number().int().optional()),
});

// ───────── Wings & rosters (Phase 3) ─────────
const linesToArray = (value: unknown) =>
  typeof value === "string" ? value.split("\n").map((line) => line.trim()).filter(Boolean) : value;

export const wingUpdateSchema = z.object({
  wingId: z.string().cuid(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(500),
  responsibilities: z.preprocess(linesToArray, z.array(z.string().trim().min(2).max(120)).min(1)),
  syllabusUrl: z.preprocess(emptyToUndefined, httpUrl.optional()),
  leadMemberId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
});

export const wingRosterSchema = z.object({
  wingId: z.string().cuid(),
  memberId: z.string().cuid(),
  role: z.enum(["LEAD", "CORE", "MEMBER"]),
  decision: z.enum(["ADD", "UPDATE", "REMOVE"]).default("ADD"),
});

// ───────── Events & attendance (Phase 4) ─────────
export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export const eventSchema = z
  .object({
    id: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
    type: z.enum(["HACKATHON", "WORKSHOP", "COURSE"]),
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().min(10).max(3000),
    startsAt: utcDateTimeSchema,
    endsAt: z.preprocess(emptyToUndefined, utcDateTimeSchema.optional()),
    capacity: z.coerce.number().int().min(0).max(10_000),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    wingId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
    syllabus: z.preprocess(parseJson, z.record(z.unknown()).optional()),
  })
  .refine((value) => !value.endsAt || value.endsAt >= value.startsAt, {
    message: "End time must be after the start time",
    path: ["endsAt"],
  });

export const eventActionSchema = z.object({
  eventId: z.string().cuid(),
  decision: z.enum(["PUBLISH", "ARCHIVE", "UNARCHIVE"]),
});

export const eventFilterSchema = z.object({
  tab: z.preprocess(emptyToUndefined, z.enum(["upcoming", "past"]).optional()),
});

export const registrationSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  memberId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
});

export const checkInSchema = z.object({
  eventId: z.string().cuid(),
  qrToken: z.string().trim().min(4).max(200),
});

// ───────── Certification & verification (Phase 5) ─────────
/** pdf-lib's standard Helvetica font can only encode WinAnsi/Latin-1 text. */
const PDF_SAFE_TEXT_REGEX = /^[\x20-\x7E\u00A0-\u00FF]+$/;
export const certificateRecipientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(PDF_SAFE_TEXT_REGEX, "Name must use Latin characters supported by the certificate PDF"),
  email: z.string().trim().toLowerCase().email().max(200),
});

const certificateRecipientLines = (input: string) =>
  input
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line.length > 0);

/** Bulk-issue input accepts one "Name, email" recipient per line. */
export function parseCertificateRecipients(input: string) {
  return certificateRecipientLines(input).map(({ line, index }) => {
    const separator = line.indexOf(",");
    const parsed = certificateRecipientSchema.safeParse({
      name: line.slice(0, separator).trim(),
      email: line.slice(separator + 1).trim(),
    });
    if (!parsed.success) throw new Error(`Invalid recipient on line ${index + 1}: use "Name, email"`);
    return parsed.data;
  });
}

export const certIssueSchema = z
  .object({
    eventId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
    type: z.enum(["PARTICIPANT", "WINNER", "EXECUTIVE", "COURSE"]),
    recipients: z.string().trim().min(3).max(20_000),
  })
  .refine((value) => certificateRecipientLines(value.recipients).length <= 50, {
    message: "Issue at most 50 certificates at a time",
    path: ["recipients"],
  });

export const certRevokeSchema = z.object({
  certId: certIdSchema,
  reason: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()),
});

// ───────── Content CMS (Phase 6) ─────────
const checkboxToBoolean = (value: unknown) => value === true || value === "on" || value === "true";
const pdfUrlSchema = z.string().max(500).refine(
  (url) => /^\/uploads\/[\w.-]+\.pdf$/.test(url) || /^https?:\/\//i.test(url),
  "Use an http(s) URL or a local PDF upload",
);

export const HOF_CATEGORIES = ["ICPC", "NCPC", "HACKATHON", "GSOC", "ALUMNI"] as const;
export const NOTICE_CATEGORIES = ["RECRUITMENT", "COMMITTEE", "CONTEST", "CAMPUS", "URGENT"] as const;

export const magazineIssueSchema = z.object({
  id: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  number: z.coerce.number().int().positive().max(999),
  title: z.string().trim().min(2).max(150),
  pdfUrl: z.preprocess(emptyToUndefined, pdfUrlSchema.optional()),
  coverUrl: z.preprocess(emptyToUndefined, photoUrlSchema.optional()),
  featured: z.preprocess(checkboxToBoolean, z.boolean()),
  publishedAt: z.preprocess(emptyToUndefined, utcDateTimeSchema.optional()),
});

export const articleModerationSchema = z
  .object({
    id: z.string().min(1),
    decision: z.enum(["APPROVE", "REJECT"]),
    issueId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    title: z.preprocess(emptyToUndefined, z.string().trim().min(2).max(150).optional()),
    body: z.preprocess(emptyToUndefined, z.string().trim().min(10).max(10_000).optional()),
  })
  .refine((value) => value.decision !== "APPROVE" || Boolean(value.issueId), {
    message: "Choose an issue before approving",
    path: ["issueId"],
  });

export const projectSchema = z.object({
  id: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10).max(3000),
  githubUrl: githubRepoSchema,
  demoUrl: z.preprocess(emptyToUndefined, httpUrl.optional()),
  techStack: z.preprocess(linesToArray, z.array(z.string().trim().min(1).max(50)).min(1).max(20)),
  contributors: z.preprocess(linesToArray, z.array(z.string().trim().min(1).max(100)).min(1).max(30)),
  tags: z.preprocess(linesToArray, z.array(z.string().trim().min(1).max(50)).min(1).max(20)),
  status: z.enum(["SUBMITTED", "APPROVED", "REJECTED"]).default("SUBMITTED"),
  featured: z.preprocess(checkboxToBoolean, z.boolean()),
});

export const projectReviewSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["APPROVE", "REJECT"]),
  featured: z.preprocess(checkboxToBoolean, z.boolean()),
});

export const projectFilterSchema = z.object({
  tag: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
});

export const hallOfFameSchema = z.object({
  id: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  category: z.enum(HOF_CATEGORIES),
  title: z.string().trim().min(3).max(150),
  personName: z.string().trim().min(2).max(100),
  year: z.coerce.number().int().min(2000).max(2100),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
  imageUrl: z.preprocess(emptyToUndefined, photoUrlSchema.optional()),
  verified: z.preprocess(checkboxToBoolean, z.boolean()),
});

export const hallOfFameFilterSchema = z.object({
  category: z.preprocess(emptyToUndefined, z.enum(HOF_CATEGORIES).optional()),
});

export const noticeSchema = z
  .object({
    id: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    title: z.string().trim().min(3).max(150),
    body: z.string().trim().min(10).max(3000),
    category: z.enum(NOTICE_CATEGORIES),
    pinned: z.preprocess(checkboxToBoolean, z.boolean()),
    publishAt: utcDateTimeSchema,
    expireAt: z.preprocess(emptyToUndefined, utcDateTimeSchema.optional()),
  })
  .refine((value) => !value.expireAt || value.expireAt > value.publishAt, {
    message: "Expiry must be after the publish time",
    path: ["expireAt"],
  });

export const noticeFilterSchema = z.object({
  category: z.preprocess(emptyToUndefined, z.enum(NOTICE_CATEGORIES).optional()),
});
