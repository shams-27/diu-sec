import { db } from "@/backend/shared/db";
import type { Actor } from "@/backend/shared/rbac";

/** A wing lead only ever counts their own wing; an empty id matches nothing. */
export function dashboardScopes(actor: Actor) {
  const own = actor.role === "WING_LEAD";
  const wingId = own ? (actor.wingId ?? "") : "";
  return {
    member: own ? { wingPrefId: wingId } : {},
    event: own ? { event: { wingId } } : {},
    wing: own ? { id: wingId } : {},
  };
}

export async function dashboardData(actor: Actor) {
  const scope = dashboardScopes(actor);
  const [activeMembers, pendingApplications, eventRegistrations, issuedCertificates, grouped, wings] = await Promise.all([
    db.member.count({ where: { status: "APPROVED", ...scope.member } }),
    db.member.count({ where: { status: "PENDING", ...scope.member } }),
    db.registration.count({ where: { status: "CONFIRMED", ...scope.event } }),
    db.certificate.count({ where: scope.event }),
    db.member.groupBy({
      by: ["wingPrefId"],
      where: { status: "APPROVED", wingPrefId: { not: null }, ...scope.member },
      _count: { _all: true },
    }),
    db.wing.findMany({ where: scope.wing, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return {
    cards: [
      { label: "Active members", value: activeMembers },
      { label: "Pending applications", value: pendingApplications },
      { label: "Event registrations", value: eventRegistrations },
      { label: "Issued certificates", value: issuedCertificates },
    ],
    chart: wings.map((wing) => ({
      name: wing.name,
      members: grouped.find((row) => row.wingPrefId === wing.id)?._count._all ?? 0,
    })),
  };
}
