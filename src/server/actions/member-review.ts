"use server";

import { Prisma, type MemberStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/admin-guard";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { nextMemberCardNo } from "@/lib/idcard";
import { can, ForbiddenError } from "@/lib/rbac";
import { memberReviewSchema } from "@/lib/validators";

export async function reviewMemberAction(formData: FormData): Promise<void> {
  const actor = await requireActor("members", "write");
  const { memberId, decision } = memberReviewSchema.parse(Object.fromEntries(formData));

  await db.$transaction(
    async (tx) => {
      const before = await tx.member.findUnique({
        where: { id: memberId },
        select: { status: true, memberCardNo: true, cardIssuedAt: true, wingPrefId: true },
      });
      if (!before) throw new Error("Member not found");
      if (!can(actor, "members", "write", before.wingPrefId)) throw new ForbiddenError();

      const target: MemberStatus = decision === "REJECT" ? "REJECTED" : decision === "REVOKE" ? "REVOKED" : "APPROVED";
      if (before.status === target) return;

      const now = new Date();
      // Keep the same card number across reissues: recycling an old number would make revoked cards valid again.
      const cardNo = before.memberCardNo ?? (await nextMemberCardNo(tx, now));
      const after =
        target === "APPROVED"
          ? { status: target, memberCardNo: cardNo, cardIssuedAt: now }
          : { status: target };

      await tx.member.update({ where: { id: memberId }, data: after });
      await writeAudit(
        {
          actorId: actor.id,
          action: decision,
          entity: "Member",
          entityId: memberId,
          before: before as Prisma.InputJsonValue,
          after: after as Prisma.InputJsonValue,
        },
        tx,
      );
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  revalidatePath("/admin/members");
  revalidatePath(`/join/${memberId}`);
}
