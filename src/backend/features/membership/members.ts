"use server";

import { Prisma } from "@prisma/client";
import { writeAudit } from "@/backend/shared/audit";
import { db } from "@/backend/shared/db";
import { isBot } from "@/backend/shared/honeypot";
import { rateLimited } from "@/backend/shared/rate-limit";
import { memberApplicationSchema, type SubmitState } from "@/backend/shared/validators";

const DUPLICATE = "An application with that student ID or email already exists.";
const TOO_MANY = "Too many submissions. Please try again in a few minutes.";

export async function submitMembershipAction(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  if (isBot(formData)) return {};
  if (await rateLimited("join")) return { error: TOO_MANY };

  const parsed = memberApplicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check your student ID (XXX-35-XXX) and @diu.edu.bd email." };

  const input = parsed.data;
  const duplicate = await db.member.findFirst({
    where: { OR: [{ studentId: input.studentId }, { email: input.email }] },
    select: { id: true },
  });
  if (duplicate) return { error: DUPLICATE };

  const data = {
    name: input.name,
    studentId: input.studentId,
    email: input.email,
    batch: input.batch ?? null,
    phone: input.phone ?? null,
    wingPrefId: input.wingPrefId ?? null,
    status: "PENDING" as const,
  };

  try {
    const member = await db.$transaction(
      async (tx) => {
        const created = await tx.member.create({ data, select: { id: true } });
        await writeAudit(
          {
            actorId: null,
            actorEmail: input.email,
            action: "CREATE",
            entity: "Member",
            entityId: created.id,
            after: data as Prisma.InputJsonValue,
          },
          tx,
        );
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { memberId: member.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: DUPLICATE };
    throw error;
  }
}
