"use server";

import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/admin-guard";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { removeUploadedAsset, saveUpload } from "@/lib/storage";
import { sponsorSchema } from "@/lib/validators";

export async function saveSponsorAction(formData: FormData): Promise<void> {
  const actor = await requireActor("sponsors", "write");
  const input = sponsorSchema.parse(Object.fromEntries(formData));
  const logoFile = formData.get("logo");
  const uploadedLogo = logoFile instanceof File && logoFile.size > 0 ? await saveUpload(logoFile, "image") : null;
  const logoUrl = uploadedLogo ?? input.logoUrl ?? null;
  const data = {
    kind: input.kind,
    name: input.name,
    logoUrl,
    websiteUrl: input.websiteUrl,
    tier: input.tier,
    bio: input.bio,
    order: input.order,
  };
  try {
    await db.$transaction(
      async (tx) => {
        const saved = await tx.sponsor.upsert({
          where: { id: input.id ?? randomUUID() },
          create: data,
          update: data,
        });
        await writeAudit(
          {
            actorId: actor.id,
            action: input.id ? "UPDATE" : "CREATE",
            entity: "Sponsor",
            entityId: saved.id,
            after: data as Prisma.InputJsonValue,
          },
          tx,
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (uploadedLogo) await removeUploadedAsset(uploadedLogo);
    throw error;
  }
  revalidatePath("/admin/sponsors");
  revalidatePath("/partners");
}
