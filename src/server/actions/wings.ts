"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/admin-guard";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { can, ForbiddenError } from "@/lib/rbac";
import { wingRosterSchema, wingUpdateSchema } from "@/lib/validators";

async function loadWing(tx: Prisma.TransactionClient, wingId: string) {
  const wing = await tx.wing.findUnique({ where: { id: wingId }, select: { id: true, slug: true } });
  if (!wing) throw new Error("Wing not found");
  return wing;
}

export async function saveWingAction(formData: FormData): Promise<void> {
  const actor = await requireActor("wings", "write", "own");
  const input = wingUpdateSchema.parse(Object.fromEntries(formData));
  let wingSlug: string | undefined;
  await db.$transaction(async (tx) => {
    const wing = await loadWing(tx, input.wingId);
    wingSlug = wing.slug;
    if (!can(actor, "wings", "write", wing.id)) throw new ForbiddenError();
    const before = await tx.wing.findUnique({ where: { id: wing.id } });
    const data = {
      name: input.name,
      description: input.description,
      responsibilities: input.responsibilities,
      syllabusUrl: input.syllabusUrl,
    };
    await tx.wing.update({ where: { id: wing.id }, data });
    if (input.leadMemberId) {
      await tx.wingMember.updateMany({ where: { wingId: wing.id, role: "LEAD" }, data: { role: "MEMBER" } });
      await tx.wingMember.upsert({
        where: { wingId_memberId: { wingId: wing.id, memberId: input.leadMemberId } },
        create: { wingId: wing.id, memberId: input.leadMemberId, role: "LEAD" },
        update: { role: "LEAD" },
      });
    }
    await writeAudit(
      {
        actorId: actor.id,
        action: "UPDATE",
        entity: "Wing",
        entityId: wing.id,
        before: before as Prisma.InputJsonValue | null,
        after: { ...data, leadMemberId: input.leadMemberId ?? null } as Prisma.InputJsonValue,
      },
      tx,
    );
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath("/admin/wings");
  revalidatePath("/wings");
  if (wingSlug) revalidatePath(`/wings/${wingSlug}`);
}

export async function manageWingRosterAction(formData: FormData): Promise<void> {
  const actor = await requireActor("wings", "write", "own");
  const input = wingRosterSchema.parse(Object.fromEntries(formData));
  await db.$transaction(async (tx) => {
    const wing = await loadWing(tx, input.wingId);
    if (!can(actor, "wings", "write", wing.id)) throw new ForbiddenError();
    const existing = await tx.wingMember.findUnique({
      where: { wingId_memberId: { wingId: wing.id, memberId: input.memberId } },
    });
    if (input.decision === "REMOVE") {
      if (!existing) return;
      await tx.wingMember.delete({
        where: { wingId_memberId: { wingId: wing.id, memberId: input.memberId } },
      });
    } else {
      if (input.role === "LEAD") {
        await tx.wingMember.updateMany({ where: { wingId: wing.id, role: "LEAD" }, data: { role: "MEMBER" } });
      }
      await tx.wingMember.upsert({
        where: { wingId_memberId: { wingId: wing.id, memberId: input.memberId } },
        create: { wingId: wing.id, memberId: input.memberId, role: input.role },
        update: { role: input.role },
      });
    }
    await writeAudit(
      {
        actorId: actor.id,
        action: input.decision === "REMOVE" ? "DELETE" : existing ? "UPDATE" : "CREATE",
        entity: "WingMember",
        entityId: `${wing.id}:${input.memberId}`,
        before: existing as Prisma.InputJsonValue | null,
        after: input.decision === "REMOVE" ? null : ({ role: input.role } as Prisma.InputJsonValue),
      },
      tx,
    );
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath("/admin/wings");
  revalidatePath("/wings");
}
