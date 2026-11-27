import { beforeEach, describe, expect, it, vi } from "vitest";

const e = vi.hoisted(() => ({
  writeAudit: vi.fn(),
  contactCreate: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/audit", () => ({ writeAudit: e.writeAudit }));
vi.mock("@/lib/db", () => ({
  db: { contactMessage: { create: e.contactCreate }, $transaction: e.transaction },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { contactSchema } from "@/lib/validators";
import { submitContactAction } from "@/server/actions/contact";

const form = () => {
  const data = new FormData();
  data.set("name", "Jane Doe");
  data.set("email", "jane@diu.edu.bd");
  data.set("message", "I would like to know about the next workshop.");
  return data;
};

describe("contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.contactCreate.mockResolvedValue({ id: "c1" });
    e.transaction.mockImplementation(async (callback) => callback({ contactMessage: { create: e.contactCreate } }));
  });

  it("requires a real message and a name", () => {
    expect(contactSchema.safeParse({ name: "J", email: "jane@diu.edu.bd", message: "short" }).success).toBe(false);
  });

  it("stores a message and audits it with the sender email", async () => {
    await expect(submitContactAction({}, form())).resolves.toEqual({ sent: true });
    expect(e.contactCreate).toHaveBeenCalled();
    expect(e.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CREATE", entity: "ContactMessage", actorEmail: "jane@diu.edu.bd" }),
      expect.anything(),
    );
  });

  it("returns a friendly error for invalid input without writing", async () => {
    const data = new FormData();
    data.set("name", "J");
    data.set("email", "bad");
    data.set("message", "short");
    await expect(submitContactAction({}, data)).resolves.toEqual({ error: expect.any(String) });
    expect(e.contactCreate).not.toHaveBeenCalled();
  });
});
