"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/backend/shared/admin-guard";
import { writeAudit } from "@/backend/shared/audit";
import { db } from "@/backend/shared/db";
import { roleAssignmentSchema } from "@/backend/shared/validators";

export async function setUserRoleAction(formData: FormData): Promise<void> {
  const actor = await requireActor("access", "write");
  const input = roleAssignmentSchema.parse(Object.fromEntries(formData));
  const after = { role: input.role, wingId: input.role ? (input.wingId ?? null) : null };

  await db.$transaction(
    async (tx) => {
      const before = await tx.user.findUnique({
        where: { id: input.userId },
        select: { role: true, wingId: true },
      });
      if (!before) throw new Error("User not found");
      if (before.role === "SUPER_ADMIN" && after.role !== "SUPER_ADMIN") {
        const admins = await tx.user.count({ where: { role: "SUPER_ADMIN" } });
        if (admins <= 1) throw new Error("Cannot demote the last super admin");
      }
      await tx.user.update({ where: { id: input.userId }, data: after });
      await writeAudit(
        {
          actorId: actor.id,
          action: "UPDATE",
          entity: "User",
          entityId: input.userId,
          before: before as Prisma.InputJsonValue,
          after: after as Prisma.InputJsonValue,
        },
        tx,
      );
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  revalidatePath("/admin/access");
}
