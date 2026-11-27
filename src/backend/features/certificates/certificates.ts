"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/backend/shared/admin-guard";
import { writeAudit } from "@/backend/shared/audit";
import { renderCertificatePdf } from "@/backend/features/certificates/certs";
import { db } from "@/backend/shared/db";
import { can, ForbiddenError } from "@/backend/shared/rbac";
import { removeUploadedAsset, saveGeneratedPdf } from "@/backend/shared/storage";
import {
  certIssueSchema,
  certRevokeSchema,
  generateCertId,
  parseCertificateRecipients,
} from "@/backend/shared/validators";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function issueCertificatesAction(formData: FormData): Promise<void> {
  const actor = await requireActor("certificates", "write", "own");
  const input = certIssueSchema.parse(Object.fromEntries(formData));
  const recipients = parseCertificateRecipients(input.recipients);
  const emails = recipients.map((recipient) => recipient.email);
  if (new Set(emails).size !== emails.length) throw new Error("Duplicate recipient email in the list");

  let eventTitle: string | null = null;
  if (input.eventId) {
    const event = await db.event.findUnique({
      where: { id: input.eventId },
      select: { title: true, wingId: true },
    });
    if (!event) throw new Error("Event not found");
    if (!can(actor, "certificates", "write", event.wingId)) throw new ForbiddenError();
    eventTitle = event.title;
  } else if (!can(actor, "certificates", "write")) {
    throw new ForbiddenError();
  }

  const existing = await db.certificate.findMany({
    where: { eventId: input.eventId ?? null, type: input.type, recipientEmail: { in: emails } },
    select: { recipientEmail: true },
  });
  if (existing.length > 0) {
    throw new Error(`Certificate already issued to ${existing[0].recipientEmail ?? "a recipient"}`);
  }

  // Allocate IDs and render PDFs before the transaction so it stays short.
  const batch: { certId: string; recipient: { name: string; email: string }; issuedAt: Date; pdfUrl: string }[] = [];
  for (const recipient of recipients) {
    let certId = "";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generateCertId();
      const taken = await db.certificate.findUnique({ where: { certId: candidate }, select: { id: true } });
      if (!taken) {
        certId = candidate;
        break;
      }
    }
    if (!certId) throw new Error("Could not allocate a unique certificate ID");

    const issuedAt = new Date();
    const pdf = await renderCertificatePdf({
      certId,
      recipientName: recipient.name,
      type: input.type,
      issuedAt,
      eventTitle,
      siteUrl: SITE_URL,
    });
    const pdfUrl = await saveGeneratedPdf(pdf);
    batch.push({ certId, recipient, issuedAt, pdfUrl });
  }

  try {
    await db.$transaction(
      async (tx) => {
        for (const { certId, recipient, issuedAt, pdfUrl } of batch) {
          const saved = await tx.certificate.create({
            data: {
              certId,
              recipientName: recipient.name,
              recipientEmail: recipient.email,
              type: input.type,
              eventId: input.eventId ?? null,
              issuedAt,
              pdfUrl,
            },
          });
          await writeAudit(
            {
              actorId: actor.id,
              action: "CREATE",
              entity: "Certificate",
              entityId: saved.id,
              after: { certId, ...recipient, type: input.type, eventId: input.eventId ?? null } as Prisma.InputJsonValue,
            },
            tx,
          );
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) {
      await Promise.all(batch.map(({ pdfUrl }) => removeUploadedAsset(pdfUrl)));
      throw new Error("Issuance conflicted with another request; please retry.");
    }
    throw error;
  }

  revalidatePath("/admin/certificates");
  revalidatePath("/verify");
}

export async function revokeCertificateAction(formData: FormData): Promise<void> {
  const actor = await requireActor("certificates", "write", "own");
  const { certId, reason } = certRevokeSchema.parse(Object.fromEntries(formData));

  try {
    await db.$transaction(
      async (tx) => {
        const before = await tx.certificate.findUnique({
          where: { certId },
          select: { id: true, certId: true, status: true, event: { select: { wingId: true } } },
        });
        if (!before) throw new Error("Certificate not found");
        if (!can(actor, "certificates", "write", before.event?.wingId)) throw new ForbiddenError();
        if (before.status === "REVOKED") return;

        const revokedAt = new Date();
        await tx.certificate.update({
          where: { id: before.id },
          data: { status: "REVOKED", revokedAt, revokeReason: reason },
        });
        await writeAudit(
          {
            actorId: actor.id,
            action: "REVOKE",
            entity: "Certificate",
            entityId: before.id,
            before: { certId: before.certId, status: before.status } as Prisma.InputJsonValue,
            after: { certId, status: "REVOKED", revokedAt, revokeReason: reason ?? null } as Prisma.InputJsonValue,
          },
          tx,
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      throw new Error("Revocation conflicted with another request; please retry.");
    }
    throw error;
  }

  revalidatePath("/admin/certificates");
  revalidatePath(`/verify/${certId}`);
}
