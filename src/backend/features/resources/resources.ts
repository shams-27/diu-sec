"use server";

import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/backend/shared/admin-guard";
import { writeAudit } from "@/backend/shared/audit";
import { db } from "@/backend/shared/db";
import { resourceSchema } from "@/backend/shared/validators";

export async function saveResourceAction(formData: FormData): Promise<void> {
  const actor = await requireActor("resources", "write");
  const input = resourceSchema.parse(Object.fromEntries(formData));
  const data = { type: input.type, title: input.title, url: input.url, tags: input.tags };
  await db.$transaction(
    async (tx) => {
      const saved = await tx.resource.upsert({
        where: { id: input.id ?? randomUUID() },
        create: data,
        update: data,
      });
      await writeAudit(
        {
          actorId: actor.id,
          action: input.id ? "UPDATE" : "CREATE",
          entity: "Resource",
          entityId: saved.id,
          after: data as Prisma.InputJsonValue,
        },
        tx,
      );
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  revalidatePath("/admin/resources");
  revalidatePath("/resources");
}
