import { describe, expect, it } from "vitest";
import {
  auditFilterSchema,
  IMAGE_MIME,
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  certIdSchema,
  certIdSchema as idSchema,
  diuEmailSchema,
  nextUtcMidnight,
  generateCertId,
  githubRepoSchema,
  memberApplicationSchema,
  roleAssignmentSchema,
  studentIdSchema,
  utcDateTimeSchema,
} from "@/backend/shared/validators";

describe("UTC datetime inputs", () => {
  it("parses datetime-local values as UTC", () => {
    expect(utcDateTimeSchema.parse("2026-11-28T09:00").toISOString()).toBe("2026-11-28T09:00:00.000Z");
  });

  it("still accepts explicit UTC values", () => {
    expect(utcDateTimeSchema.parse("2026-11-28T09:00Z").toISOString()).toBe("2026-11-28T09:00:00.000Z");
  });
});

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

describe("role assignment", () => {
  it("accepts a known role with a wing", () => {
    expect(roleAssignmentSchema.safeParse({ userId: "u1", role: "WING_LEAD", wingId: "w1" }).success).toBe(true);
  });

  it("accepts a role without a wing", () => {
    expect(roleAssignmentSchema.safeParse({ userId: "u1", role: "SUPER_ADMIN" }).success).toBe(true);
  });

  it("rejects unknown roles and empty user IDs", () => {
    expect(roleAssignmentSchema.safeParse({ userId: "u1", role: "ADMIN" }).success).toBe(false);
    expect(roleAssignmentSchema.safeParse({ userId: "", role: "WING_LEAD" }).success).toBe(false);
  });
});

describe("audit filters", () => {
  it("accepts a known audit action", () => {
    expect(auditFilterSchema.safeParse({ action: "UPDATE" }).success).toBe(true);
  });

  it("rejects an unknown audit action", () => {
    expect(auditFilterSchema.safeParse({ action: "DROP_TABLE" }).success).toBe(false);
  });

  it("coerces a date string to midnight UTC", () => {
    const parsed = auditFilterSchema.parse({ from: "2026-11-27" });
    expect(parsed.from?.toISOString()).toBe("2026-11-27T00:00:00.000Z");
  });

  it("rejects an invalid date", () => {
    expect(auditFilterSchema.safeParse({ from: "not-a-date" }).success).toBe(false);
  });

  it("treats empty filter values as absent", () => {
    expect(auditFilterSchema.parse({ action: "", entity: "", email: "" })).toEqual({});
  });
});

describe("role revocation and audit date bounds", () => {
  it("accepts an empty role as no role", () => {
    expect(roleAssignmentSchema.parse({ userId: "u1", role: "" }).role).toBeNull();
  });

  it("includes the whole selected end day", () => {
    expect(nextUtcMidnight(new Date("2026-11-27T00:00:00Z")).toISOString()).toBe("2026-11-28T00:00:00.000Z");
  });
});
