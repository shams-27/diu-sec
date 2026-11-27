import type { Prisma } from "@prisma/client";

/** Allocates SEC-<year>-<seq> inside the caller's transaction; the unique DB index is the backstop. */
export async function nextMemberCardNo(tx: Prisma.TransactionClient, date: Date): Promise<string> {
  const prefix = `SEC-${date.getUTCFullYear()}-`;
  const used = await tx.member.count({ where: { memberCardNo: { startsWith: prefix } } });
  return `${prefix}${String(used + 1).padStart(4, "0")}`;
}
