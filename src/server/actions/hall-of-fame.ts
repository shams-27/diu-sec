"use server";

import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/backend/shared/admin-guard";
import { writeAudit } from "@/backend/shared/audit";
import { db } from "@/backend/shared/db";
import { hallOfFameSchema } from "@/backend/shared/validators";

export async function saveHallOfFameEntryAction(formData: FormData): Promise<void> {
  const actor = await requireActor("hallOfFame", "write");
  const input = hallOfFameSchema.parse(Object.fromEntries(formData));
  const data = {
    category: input.category,
    title: input.title,
    personName: input.personName,
    year: input.year,
    description: input.description,
    imageUrl: input.imageUrl,
    verified: input.verified,
  };
  await db.$transaction(async (tx) => {
    const saved = await tx.hallOfFameEntry.upsert({
      where: { id: input.id ?? randomUUID() },
      create: data,
      update: data,
    });
    await writeAudit(
      {
        actorId: actor.id,
        action: input.id ? "UPDATE" : "CREATE",
        entity: "HallOfFameEntry",
        entityId: saved.id,
        after: data as Prisma.InputJsonValue,
      },
      tx,
    );
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath("/admin/hall-of-fame");
  revalidatePath("/hall-of-fame");
}
