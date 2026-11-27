import { db } from "@/backend/shared/db";
import { nextUtcMidnight } from "@/backend/shared/validators";
import type { AuditAction } from "@prisma/client";

export function getAuditLogs(filters: {
  action?: AuditAction;
  entity?: string;
  email?: string;
  from?: Date;
  to?: Date;
}) {
  return db.auditLog.findMany({
    where: {
      action: filters.action,
      entity: filters.entity ? { contains: filters.entity, mode: "insensitive" } : undefined,
      OR: filters.email
        ? [
            { actor: { email: { equals: filters.email, mode: "insensitive" } } },
            { actorEmail: { equals: filters.email, mode: "insensitive" } },
          ]
        : undefined,
      createdAt: { gte: filters.from, lt: filters.to ? nextUtcMidnight(filters.to) : undefined },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: true },
  });
}
