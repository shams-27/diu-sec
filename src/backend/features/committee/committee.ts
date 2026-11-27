"use server";

import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/backend/shared/admin-guard";
import { writeAudit } from "@/backend/shared/audit";
import { db } from "@/backend/shared/db";
import { removeUploadedAsset, saveUpload } from "@/backend/shared/storage";
import {
  committeeDeleteSchema,
  committeeMemberSchema,
  committeeReorderSchema,
  sessionActionSchema,
  sessionCreateSchema,
} from "@/backend/shared/validators";

async function refresh() {
  revalidatePath("/admin/committee");
  revalidatePath("/committee");
}

export async function createSessionAction(formData: FormData): Promise<void> {
  const actor = await requireActor("committee", "write");
  const input = sessionCreateSchema.parse(Object.fromEntries(formData));
  await db.$transaction(async (tx) => {
    const created = await tx.execSession.create({ data: input });
    await writeAudit(
      { actorId: actor.id, action: "CREATE", entity: "ExecSession", entityId: created.id, after: input },
      tx,
    );
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  await refresh();
}

export async function manageSessionAction(formData: FormData): Promise<void> {
  const actor = await requireActor("committee", "write");
  const input = sessionActionSchema.parse(Object.fromEntries(formData));
  await db.$transaction(async (tx) => {
    const before = await tx.execSession.findUnique({ where: { id: input.sessionId } });
    if (!before) throw new Error("Session not found");
    if (input.decision === "SET_CURRENT") {
      await tx.execSession.updateMany({ data: { isCurrent: false } });
    }
    const data =
      input.decision === "ARCHIVE"
        ? { archived: true, isCurrent: false }
        : input.decision === "UNARCHIVE"
          ? { archived: false }
          : { archived: false, isCurrent: true };
    await tx.execSession.update({ where: { id: input.sessionId }, data });
    await writeAudit(
      {
        actorId: actor.id,
        action: "UPDATE",
        entity: "ExecSession",
        entityId: input.sessionId,
        before: before as Prisma.InputJsonValue,
        after: data as Prisma.InputJsonValue,
      },
      tx,
    );
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  await refresh();
}

export async function saveCommitteeMemberAction(formData: FormData): Promise<void> {
  const actor = await requireActor("committee", "write");
  const input = committeeMemberSchema.parse(Object.fromEntries(formData));
  const photoUrl = await saveUpload(formData.get("photo"), "image");
  try {
    await db.$transaction(async (tx) => {
      const before = input.id ? await tx.committeeMember.findUnique({ where: { id: input.id } }) : null;
      const data = {
        ...input,
        id: input.id ?? randomUUID(),
        photoUrl: photoUrl ?? input.photoUrl,
        socialLinks: (input.socialLinks ?? null) as Prisma.InputJsonValue,
      };
      const saved = await tx.committeeMember.upsert({
        where: { id: data.id },
        create: data,
        update: { ...input, photoUrl: data.photoUrl, socialLinks: data.socialLinks },
      });
      await writeAudit(
        {
          actorId: actor.id,
          action: before ? "UPDATE" : "CREATE",
          entity: "CommitteeMember",
          entityId: saved.id,
          before: before as Prisma.InputJsonValue | null,
          after: data as Prisma.InputJsonValue,
        },
        tx,
      );
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (photoUrl) await removeUploadedAsset(photoUrl);
    throw error;
  }
  await refresh();
}

export async function deleteCommitteeMemberAction(formData: FormData): Promise<void> {
  const actor = await requireActor("committee", "write");
  const { id } = committeeDeleteSchema.parse(Object.fromEntries(formData));
  await db.$transaction(async (tx) => {
    const before = await tx.committeeMember.findUnique({ where: { id } });
    if (!before) throw new Error("Committee member not found");
    await tx.committeeMember.delete({ where: { id } });
    await writeAudit(
      { actorId: actor.id, action: "DELETE", entity: "CommitteeMember", entityId: id, before: before as Prisma.InputJsonValue },
      tx,
    );
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  await refresh();
}

export async function reorderCommitteeAction(formData: FormData): Promise<void> {
  const actor = await requireActor("committee", "write");
  const { sessionId, ids } = committeeReorderSchema.parse(Object.fromEntries(formData));
  await db.$transaction(async (tx) => {
    const rows = await tx.committeeMember.findMany({ where: { id: { in: ids } }, select: { sessionId: true } });
    if (rows.length !== ids.length || rows.some((row) => row.sessionId !== sessionId)) {
      throw new Error("Reorder list does not match this session");
    }
    for (const [order, id] of ids.entries()) {
      await tx.committeeMember.update({ where: { id }, data: { order } });
    }
    await writeAudit(
      { actorId: actor.id, action: "UPDATE", entity: "CommitteeOrder", entityId: sessionId, after: { ids } },
      tx,
    );
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  await refresh();
}
