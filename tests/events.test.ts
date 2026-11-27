import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/backend/shared/rbac";

const e = vi.hoisted(() => ({
  requireActor: vi.fn(),
  writeAudit: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  create: vi.fn(),
  findFirst: vi.fn(),
  transaction: vi.fn(),
  rateLimited: vi.fn(),
}));
vi.mock("@/backend/shared/rate-limit", () => ({ rateLimited: e.rateLimited }));
vi.mock("@/backend/shared/admin-guard", () => ({ requireActor: e.requireActor }));
vi.mock("@/backend/shared/audit", () => ({ writeAudit: e.writeAudit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock("@/backend/shared/db", () => ({
  db: {
    event: { findUnique: e.findUnique, update: e.update, updateMany: e.updateMany },
    registration: { findUnique: e.findUnique, create: e.create, findFirst: e.findFirst, update: e.update },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => e.transaction(fn),
  },
}));

const tx = {
  event: { findUnique: e.findUnique, update: e.update, updateMany: e.updateMany },
  registration: { findUnique: e.findUnique, create: e.create, findFirst: e.findFirst, update: e.update },
};
e.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx));

import {
  checkInSchema,
  eventSchema,
  registrationSchema,
  slugify,
} from "@/backend/shared/validators";
import { checkInAction, registerForEventAction } from "@/server/actions/events";

const EVENT = "cmwypjwbz0009sbfj0tu78g24";
const fd = (entries: [string, string][]) => {
  const data = new FormData();
  for (const [key, value] of entries) data.set(key, value);
  return data;
};
const registrationForm = fd([
  ["eventId", EVENT],
  ["name", "Jane Doe"],
  ["email", "jane@diu.edu.bd"],
]);

describe("phase 4 validators", () => {
  it("slugifies titles for event URLs", () => {
    expect(slugify("DIU SEC / Hackathon 2026!")).toBe("diu-sec-hackathon-2026");
  });

  it("rejects an event with an end before its start", () => {
    expect(
      eventSchema.safeParse({
        type: "WORKSHOP",
        title: "Web basics",
        description: "A hands-on workshop",
        startsAt: "2026-12-10T10:00:00Z",
        endsAt: "2026-12-09T10:00:00Z",
        capacity: "20",
        status: "DRAFT",
      }).success,
    ).toBe(false);
  });

  it("rejects a blank QR token", () => {
    expect(checkInSchema.safeParse({ eventId: EVENT, qrToken: "  " }).success).toBe(false);
  });

  it("requires a valid event id for registration", () => {
    expect(registrationSchema.safeParse({ eventId: "bad", name: "Jane", email: "jane@diu.edu.bd" }).success).toBe(false);
  });

  it("normalizes registration emails so duplicates cannot differ by case", () => {
    const parsed = registrationSchema.parse({
      eventId: EVENT,
      name: "Jane Doe",
      email: "Jane@DIU.edu.bd",
    });
    expect(parsed.email).toBe("jane@diu.edu.bd");
  });
});

describe("event registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.rateLimited.mockResolvedValue(false);
    e.findUnique.mockResolvedValue({
      id: EVENT,
      capacity: 2,
      seatsTaken: 1,
      status: "PUBLISHED",
      wingId: null,
      slug: "test-event",
    });
    e.findFirst.mockResolvedValue(null);
    e.create.mockImplementation(async ({ data }) => ({ id: "r1", qrToken: data.qrToken }));
  });

  it("blocks an over-rate registration before touching a seat", async () => {
    e.rateLimited.mockResolvedValue(true);

    const result = await registerForEventAction({}, registrationForm);

    expect(result.error).toMatch(/too many/i);
    expect(e.findUnique).not.toHaveBeenCalled();
    expect(e.update).not.toHaveBeenCalled();
    expect(e.create).not.toHaveBeenCalled();
  });

  it("rejects a full event without creating a registration", async () => {
    e.findUnique.mockResolvedValue({ id: EVENT, capacity: 2, seatsTaken: 2, status: "PUBLISHED", wingId: null });
    const result = await registerForEventAction({}, registrationForm);
    expect(result.error).toMatch(/full/i);
    expect(e.create).not.toHaveBeenCalled();
    expect(e.update).not.toHaveBeenCalled();
  });

  it("rejects a duplicate email for the same event", async () => {
    e.findFirst.mockResolvedValue({ id: "existing" });
    const result = await registerForEventAction({}, registrationForm);
    expect(result.error).toMatch(/already registered/i);
    expect(e.create).not.toHaveBeenCalled();
  });

  it("reserves a seat atomically and returns a QR data URL", async () => {
    const result = await registerForEventAction({}, registrationForm);
    expect(e.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: EVENT }, data: { seatsTaken: { increment: 1 } } }),
    );
    expect(e.create).toHaveBeenCalled();
    expect(result.qrToken).toBeTruthy();
    expect(result.qrDataUrl).toMatch(/^data:image\/png/);
    expect(e.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ actorEmail: "jane@diu.edu.bd", entity: "Registration" }),
      tx,
    );
  });
});

describe("event check-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.findUnique.mockResolvedValue({ wingId: null });
  });

  it("blocks double check-in", async () => {
    e.requireActor.mockResolvedValue({ id: "u1", role: "SUPER_ADMIN" });
    e.findUnique
      .mockResolvedValueOnce({ wingId: null })
      .mockResolvedValueOnce({ id: "r1", eventId: EVENT, qrToken: "token", checkedInAt: new Date() });
    const result = await checkInAction({}, fd([["eventId", EVENT], ["qrToken", "token"]]));
    expect(result.error).toMatch(/already checked in/i);
    expect(e.writeAudit).not.toHaveBeenCalled();
  });

  it("denies a wing lead checking in another wing's event", async () => {
    e.requireActor.mockResolvedValue({ id: "u1", role: "WING_LEAD", wingId: "w1" });
    e.findUnique.mockResolvedValueOnce({ wingId: "w2" });
    await expect(checkInAction({}, fd([["eventId", EVENT], ["qrToken", "token"]]))).rejects.toThrow(ForbiddenError);
  });

  it("checks in a valid token once and audits it", async () => {
    e.requireActor.mockResolvedValue({ id: "u1", role: "SUPER_ADMIN" });
    e.findUnique
      .mockResolvedValueOnce({ wingId: null })
      .mockResolvedValueOnce({ id: "r1", eventId: EVENT, name: "Jane Doe", qrToken: "token", checkedInAt: null });
    const result = await checkInAction({}, fd([["eventId", EVENT], ["qrToken", "token"]]));
    expect(result.checkedIn).toBe("Jane Doe");
    expect(e.requireActor).toHaveBeenCalledWith("events", "write", "own");
    expect(e.writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "APPROVE", entity: "Registration" }), tx);
  });
});
