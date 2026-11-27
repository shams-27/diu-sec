import { describe, expect, it, vi } from "vitest";

type JwtArgs = { token: Record<string, unknown>; user?: unknown };
type CapturedConfig = {
  callbacks: { jwt: (args: JwtArgs) => Promise<Record<string, unknown>> };
};

const { findUnique, setConfig, getConfig } = vi.hoisted(() => {
  let cfg: CapturedConfig | null = null;
  return {
    findUnique: vi.fn(),
    setConfig: (value: CapturedConfig) => {
      cfg = value;
    },
    getConfig: () => cfg!,
  };
});

vi.mock("@/backend/shared/db", () => ({ db: { user: { findUnique } } }));
vi.mock("next-auth/providers/google", () => ({ default: () => ({ id: "google" }) }));
vi.mock("next-auth", () => ({
  default: (config: unknown) => {
    setConfig(config as CapturedConfig);
    return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() };
  },
}));

describe("JWT session claims", () => {
  it("refreshes the role from the database on every session read", async () => {
    await import("@/backend/shared/auth");
    findUnique.mockResolvedValue({ id: "u1", role: "WING_LEAD", wingId: "w1" });

    const token = { email: "Lead@DIU.edu.bd", role: "SUPER_ADMIN", wingId: null };
    const next = await getConfig().callbacks.jwt({ token });

    expect(findUnique).toHaveBeenCalledWith({ where: { email: "lead@diu.edu.bd" } });
    expect(next).toMatchObject({ id: "u1", role: "WING_LEAD", wingId: "w1" });
  });

  it("clears the role when the user row is gone", async () => {
    await import("@/backend/shared/auth");
    findUnique.mockResolvedValue(null);

    const next = await getConfig().callbacks.jwt({ token: { email: "gone@diu.edu.bd", role: "SUPER_ADMIN" } });

    expect(next).toMatchObject({ id: null, role: null, wingId: null });
  });
});
