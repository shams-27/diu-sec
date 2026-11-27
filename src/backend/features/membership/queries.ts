import type { MemberStatus } from "@prisma/client";
import { db } from "@/backend/shared/db";

export function getWingOptions() {
  return db.wing.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}

export function getMemberCard(memberId: string) {
  return db.member.findUnique({
    where: { id: memberId },
    select: {
      name: true,
      studentId: true,
      email: true,
      batch: true,
      memberCardNo: true,
      status: true,
      wingPref: { select: { name: true } },
    },
  });
}

export function getMemberQueue(status?: MemberStatus, wingId?: string | null) {
  return db.member.findMany({
    where: { status, wingPrefId: wingId },
    select: {
      id: true,
      name: true,
      studentId: true,
      email: true,
      batch: true,
      status: true,
      memberCardNo: true,
      createdAt: true,
      wingPref: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export function getMembersForExport(status?: MemberStatus, wingId?: string | null) {
  return db.member.findMany({
    where: { status, wingPrefId: wingId },
    select: {
      name: true,
      studentId: true,
      email: true,
      batch: true,
      phone: true,
      status: true,
      memberCardNo: true,
      createdAt: true,
      wingPref: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function getEligibleMembers(wingId?: string | null) {
  return db.member.findMany({
    where: { status: "APPROVED", wingPrefId: wingId },
    select: { id: true, name: true, batch: true },
    orderBy: { name: "asc" },
    take: 200,
  });
}
