import { describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";
import { can, ForbiddenError } from "@/lib/rbac";
import { sessionToActor } from "@/lib/session";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/auth", () => ({ auth: authMock }));

import { requireActor } from "@/lib/admin-guard";

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

describe("requireActor own-wing reads", () => {
  it("resolves the own sentinel to the actor's wing", async () => {
    authMock.mockResolvedValue(session);
    const actor = await requireActor("members", "read", "own");
    expect(actor.wingId).toBe("w1");
  });

  it("denies the own sentinel when a wing lead has no wing", async () => {
    authMock.mockResolvedValue({ ...session, user: { ...session.user, wingId: null } });
    await expect(requireActor("members", "read", "own")).rejects.toThrow(ForbiddenError);
  });
});
