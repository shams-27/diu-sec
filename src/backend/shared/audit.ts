import { db } from "@/backend/shared/db";
import type { AuditAction, Prisma } from "@prisma/client";

export interface AuditInput {
  actorId?: string | null;
  actorEmail?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
}

/** Call from EVERY mutating server action. Append-only. */
export async function writeAudit(input: AuditInput, tx: Prisma.TransactionClient | typeof db = db) {
  await tx.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      before: input.before ?? undefined,
      after: input.after ?? undefined,
    },
  });
}
