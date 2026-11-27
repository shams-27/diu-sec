import { describe, expect, it } from "vitest";
import type { Session } from "next-auth";
import { can } from "@/lib/rbac";
import { sessionToActor } from "@/lib/session";

const session = {
  user: {
    id: "u1",
    name: "Wing Lead",
    email: "lead@diu.edu.bd",
    role: "WING_LEAD",
    wingId: "w1",
  },
  expires: "2026-12-01T00:00:00.000Z",
} as Session;

describe("session to actor", () => {
  it("maps a missing session to no role", () => {
    expect(sessionToActor(null)).toEqual({ role: null });
  });

  it("preserves role and wing and denies writes outside the matrix", () => {
    const actor = sessionToActor(session);
    expect(actor).toEqual({ role: "WING_LEAD", wingId: "w1" });
    expect(can(actor, "members", "write")).toBe(false);
    expect(can(sessionToActor(null), "access", "read")).toBe(false);
  });
});
