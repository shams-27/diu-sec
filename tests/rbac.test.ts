import { describe, expect, it } from "vitest";
import { can } from "@/backend/shared/rbac";

describe("wing-scoped access", () => {
  it("denies a wing lead writing another wing's roster", () => {
    expect(can({ role: "WING_LEAD", wingId: "w1" }, "wings", "write", "w2")).toBe(false);
  });

  it("denies own-wing access when no resource wing is supplied", () => {
    expect(can({ role: "WING_LEAD", wingId: "w1" }, "wings", "write")).toBe(false);
    expect(can({ role: "WING_LEAD", wingId: "w1" }, "members", "read", null)).toBe(false);
    expect(can({ role: "WING_LEAD" }, "members", "read", "w1")).toBe(false);
  });

  it("allows a wing lead reading their own wing's members", () => {
    expect(can({ role: "WING_LEAD", wingId: "w1" }, "members", "read", "w1")).toBe(true);
  });

  it("allows a wing lead writing their own wing's roster", () => {
    expect(can({ role: "WING_LEAD", wingId: "w1" }, "wings", "write", "w1")).toBe(true);
  });

  it("denies every module to a user with no role", () => {
    expect(can({ role: null }, "dashboard", "read")).toBe(false);
  });

  it("gives the publication editor write access to magazine but not members", () => {
    expect(can({ role: "PUBLICATION_EDITOR" }, "magazine", "write")).toBe(true);
    expect(can({ role: "PUBLICATION_EDITOR" }, "members", "read")).toBe(false);
  });
});
