import { db } from "@/backend/shared/db";

export function getCertificateAdminData(wingId?: string | null) {
  return Promise.all([
    db.certificate.findMany({
      where: wingId ? { event: { wingId } } : {},
      orderBy: { issuedAt: "desc" },
      include: { event: { select: { title: true } } },
      take: 200,
    }),
    db.event.findMany({
      where: wingId ? { wingId } : {},
      orderBy: { startsAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);
}

export function getCertificateByCertId(certId: string) {
  return db.certificate.findUnique({
    where: { certId },
    include: { event: { select: { title: true } } },
  });
}
