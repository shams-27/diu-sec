import { beforeEach, describe, expect, it, vi } from "vitest";

const e = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/backend/shared/db", () => ({ db: { auditLog: { findMany: e.findMany } } }));

import { getAuditLogs } from "@/backend/features/audit/queries";

describe("getAuditLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.findMany.mockResolvedValue([]);
  });

  it("finds public submissions by the email recorded on the audit row", async () => {
    await getAuditLogs({ email: "jane@diu.edu.bd" });
    expect(e.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { actor: { email: { equals: "jane@diu.edu.bd", mode: "insensitive" } } },
            { actorEmail: { equals: "jane@diu.edu.bd", mode: "insensitive" } },
          ],
        }),
      }),
    );
  });
});
