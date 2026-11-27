"use server";

import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import QRCode from "qrcode";
import { requireActor } from "@/backend/shared/admin-guard";
import { writeAudit } from "@/backend/shared/audit";
import { HOME_HIGHLIGHTS_TAG } from "@/backend/shared/cache-tags";
import { db } from "@/backend/shared/db";
import { rateLimited } from "@/backend/shared/rate-limit";
import { can, ForbiddenError } from "@/backend/shared/rbac";
import {
  checkInSchema,
  eventActionSchema,
  eventSchema,
  registrationSchema,
  slugify,
} from "@/backend/shared/validators";

export type RegistrationState = { error?: string; qrToken?: string; qrDataUrl?: string };
export type CheckInState = { error?: string; checkedIn?: string };

export async function registerForEventAction(
  _previous: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  if (await rateLimited("register")) return { error: "Too many submissions. Please try again in a few minutes." };
  const parsed = registrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check your name and email, then try again." };
  const input = parsed.data;
  const qrToken = `DIU-SEC-EVT-${randomUUID()}`;
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(qrToken, { margin: 1, width: 240 });
    const result = await db.$transaction(
      async (tx) => {
        const event = await tx.event.findUnique({
          where: { id: input.eventId },
          select: { capacity: true, seatsTaken: true, status: true, slug: true },
        });
        if (!event || event.status !== "PUBLISHED") return { error: "This event is not open for registration." };
        // Serializable isolation makes this read-then-increment safe against concurrent bookings.
        if (event.seatsTaken >= event.capacity) return { error: "This event is full." };
        const duplicate = await tx.registration.findFirst({
          where: { eventId: input.eventId, email: input.email },
        });
        if (duplicate) return { error: "You are already registered for this event." };
        await tx.event.update({ where: { id: input.eventId }, data: { seatsTaken: { increment: 1 } } });
        const registration = await tx.registration.create({
          data: { eventId: input.eventId, name: input.name, email: input.email, memberId: input.memberId, qrToken },
        });
        await writeAudit(
          {
            actorId: null,
            actorEmail: input.email,
            action: "CREATE",
            entity: "Registration",
            entityId: registration.id,
            after: { ...input, eventSlug: event.slug } as Prisma.InputJsonValue,
          },
          tx,
        );
        return { slug: event.slug };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if ("error" in result) return { error: result.error };
    revalidatePath("/events");
    revalidatePath(`/events/${result.slug}`);
    revalidatePath("/");
    updateTag(HOME_HIGHLIGHTS_TAG);
    return { qrToken, qrDataUrl };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return { error: "You are already registered for this event." };
      if (error.code === "P2034") return { error: "Seats just changed — please try again." };
    }
    throw error;
  }
}

export async function checkInAction(_previous: CheckInState, formData: FormData): Promise<CheckInState> {
  const actor = await requireActor("events", "write", "own");
  const { eventId, qrToken } = checkInSchema.parse(Object.fromEntries(formData));
  const result = await db.$transaction(
    async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId }, select: { wingId: true } });
      if (!event) throw new Error("Event not found");
      if (!can(actor, "events", "write", event.wingId)) throw new ForbiddenError();
      const registration = await tx.registration.findUnique({ where: { qrToken } });
      if (!registration || registration.eventId !== eventId) return { error: "Unknown QR token for this event." };
      if (registration.checkedInAt) return { error: "Already checked in." };
      const checkedInAt = new Date();
      await tx.registration.update({ where: { id: registration.id }, data: { checkedInAt } });
      await writeAudit(
        {
          actorId: actor.id,
          action: "APPROVE",
          entity: "Registration",
          entityId: registration.id,
          after: { checkedInAt } as Prisma.InputJsonValue,
        },
        tx,
      );
      return { checkedIn: registration.name };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  revalidatePath(`/admin/events/${eventId}`);
  return result;
}

export async function saveEventAction(formData: FormData): Promise<void> {
  const actor = await requireActor("events", "write", "own");
  const input = eventSchema.parse(Object.fromEntries(formData));
  const wingId = actor.role === "WING_LEAD" ? actor.wingId : input.wingId;
  if (actor.role === "WING_LEAD" && !wingId) throw new ForbiddenError();
  const slug = slugify(input.title);
  await db.$transaction(async (tx) => {
    if (input.id) {
      const before = await tx.event.findUnique({ where: { id: input.id }, select: { wingId: true } });
      if (!before) throw new Error("Event not found");
      if (!can(actor, "events", "write", before.wingId)) throw new ForbiddenError();
    }
    const data = {
      type: input.type,
      title: input.title,
      slug,
      description: input.description,
      syllabus: (input.syllabus ?? null) as Prisma.InputJsonValue,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      capacity: input.capacity,
      status: input.status,
      wingId,
    };
    const saved = await tx.event.upsert({
      where: { id: input.id ?? randomUUID() },
      create: data,
      update: data,
    });
    await writeAudit(
      {
        actorId: actor.id,
        action: input.id ? "UPDATE" : "CREATE",
        entity: "Event",
        entityId: saved.id,
        after: data as Prisma.InputJsonValue,
      },
      tx,
    );
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath("/admin/events");
  revalidatePath(`/events/${slug}`);
  revalidatePath("/");
  updateTag(HOME_HIGHLIGHTS_TAG);
}

export async function manageEventAction(formData: FormData): Promise<void> {
  const actor = await requireActor("events", "write", "own");
  const { eventId, decision } = eventActionSchema.parse(Object.fromEntries(formData));
  await db.$transaction(async (tx) => {
    const before = await tx.event.findUnique({ where: { id: eventId }, select: { wingId: true, status: true } });
    if (!before) throw new Error("Event not found");
    if (!can(actor, "events", "write", before.wingId)) throw new ForbiddenError();
    const status = decision === "PUBLISH" ? "PUBLISHED" : decision === "ARCHIVE" ? "ARCHIVED" : "DRAFT";
    await tx.event.update({ where: { id: eventId }, data: { status } });
    await writeAudit(
      {
        actorId: actor.id,
        action: decision === "PUBLISH" ? "PUBLISH" : "UPDATE",
        entity: "Event",
        entityId: eventId,
        before: before as Prisma.InputJsonValue,
        after: { status } as Prisma.InputJsonValue,
      },
      tx,
    );
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
  updateTag(HOME_HIGHLIGHTS_TAG);
}
