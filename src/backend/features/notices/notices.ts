"use server";

import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/backend/shared/admin-guard";
import { writeAudit } from "@/backend/shared/audit";
import { db } from "@/backend/shared/db";
import { noticeSchema } from "@/backend/shared/validators";

export async function saveNoticeAction(formData: FormData): Promise<void> {
  const actor = await requireActor("notices", "write");
  const input = noticeSchema.parse(Object.fromEntries(formData));
  const data = {
    title: input.title,
    body: input.body,
    category: input.category,
    pinned: input.pinned,
    publishAt: input.publishAt,
    expireAt: input.expireAt,
  };
  await db.$transaction(async (tx) => {
    const saved = await tx.notice.upsert({
      where: { id: input.id ?? randomUUID() },
      create: data,
      update: data,
    });
    await writeAudit(
      {
        actorId: actor.id,
        action: input.id ? "UPDATE" : "CREATE",
        entity: "Notice",
        entityId: saved.id,
        after: data as Prisma.InputJsonValue,
      },
      tx,
    );
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath("/admin/notices");
  revalidatePath("/notices");
}
