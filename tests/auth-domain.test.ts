import { describe, expect, it } from "vitest";
import { isDiuEmail } from "@/lib/validators";

describe("institutional domain check", () => {
  it("accepts a mixed-case DIU email", () => {
    expect(isDiuEmail("Student@DIU.edu.bd")).toBe(true);
  });

  it("rejects public and lookalike domains and non-strings", () => {
    expect(isDiuEmail("student@gmail.com")).toBe(false);
    expect(isDiuEmail("student@diu.edu.bd.evil.com")).toBe(false);
    expect(isDiuEmail(null)).toBe(false);
  });
});
