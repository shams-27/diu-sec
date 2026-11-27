import { describe, expect, it } from "vitest";
import {
  IMAGE_MIME,
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  certIdSchema,
  certIdSchema as idSchema,
  diuEmailSchema,
  generateCertId,
  githubRepoSchema,
  memberApplicationSchema,
  studentIdSchema,
} from "@/lib/validators";

describe("student ID", () => {
  it("accepts a DIU SWE ID", () => {
    expect(studentIdSchema.safeParse("221-35-123").success).toBe(true);
  });

  it("rejects a wrong department code", () => {
    expect(studentIdSchema.safeParse("221-36-123").success).toBe(false);
  });

  it("rejects a two-digit suffix", () => {
    expect(studentIdSchema.safeParse("221-35-12").success).toBe(false);
  });
});

describe("institutional email", () => {
  it("accepts a @diu.edu.bd address", () => {
    expect(diuEmailSchema.parse("Student@DIU.edu.bd")).toBe("student@diu.edu.bd");
  });

  it("rejects a public email", () => {
    expect(diuEmailSchema.safeParse("student@gmail.com").success).toBe(false);
  });

  it("rejects a lookalike domain", () => {
    expect(diuEmailSchema.safeParse("student@diu.edu.bd.evil.com").success).toBe(false);
  });
});

describe("certificate ID", () => {
  it("accepts the documented format", () => {
    expect(certIdSchema.safeParse("DIU-SEC-CERT-A2B3C4").success).toBe(true);
  });

  it("generates IDs that pass the validator", () => {
    expect(idSchema.safeParse(generateCertId()).success).toBe(true);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateCertId()));
    expect(ids.size).toBe(100);
  });
});

describe("GitHub URL", () => {
  it("accepts a repository URL", () => {
    expect(githubRepoSchema.safeParse("https://github.com/diu-sec/site").success).toBe(true);
  });

  it("rejects another host", () => {
    expect(githubRepoSchema.safeParse("https://gitlab.com/diu-sec/site").success).toBe(false);
  });
});

describe("upload limits", () => {
  it("uses the spec limits and image types", () => {
    expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
    expect(MAX_PDF_BYTES).toBe(25 * 1024 * 1024);
    expect(IMAGE_MIME).toEqual(["image/jpeg", "image/png", "image/webp"]);
  });
});

describe("member application", () => {
  it("accepts a complete application", () => {
    expect(
      memberApplicationSchema.safeParse({
        name: "A Student",
        studentId: "221-35-123",
        email: "student@diu.edu.bd",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid student ID", () => {
    expect(
      memberApplicationSchema.safeParse({
        name: "A Student",
        studentId: "221-35-12",
        email: "student@diu.edu.bd",
      }).success,
    ).toBe(false);
  });
});
