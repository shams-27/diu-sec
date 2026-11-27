"use server";

import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/backend/shared/admin-guard";
import { writeAudit } from "@/backend/shared/audit";
import { db } from "@/backend/shared/db";
import { removeUploadedAsset, saveUpload } from "@/backend/shared/storage";
import { articleModerationSchema, magazineIssueSchema } from "@/backend/shared/validators";

export async function saveMagazineIssueAction(formData: FormData): Promise<void> {
  const actor = await requireActor("magazine", "write");
  const input = magazineIssueSchema.parse(Object.fromEntries(formData));
  const pdfUrl = input.pdfUrl ?? (await saveUpload(formData.get("pdf"), "pdf"));
  if (!pdfUrl) throw new Error("An issue PDF is required");
  const coverUrl = input.coverUrl ?? (await saveUpload(formData.get("cover"), "image"));
  const uploaded = [input.pdfUrl ? null : pdfUrl, input.coverUrl ? null : coverUrl].filter(
    (url): url is string => Boolean(url),
  );

  const data = {
    number: input.number,
    title: input.title,
    pdfUrl,
    coverUrl,
    featured: input.featured,
    publishedAt: input.publishedAt,
  };
  try {
    await db.$transaction(async (tx) => {
      const saved = await tx.magazineIssue.upsert({
        where: { id: input.id ?? randomUUID() },
        create: data,
        update: data,
      });
      await writeAudit(
        {
          actorId: actor.id,
          action: input.id ? "UPDATE" : "CREATE",
          entity: "MagazineIssue",
          entityId: saved.id,
          after: data as Prisma.InputJsonValue,
        },
        tx,
      );
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    await Promise.all(uploaded.map((url) => removeUploadedAsset(url)));
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error(`Magazine issue number ${input.number} already exists`);
    }
    throw error;
  }
  revalidatePath("/admin/magazine");
  revalidatePath("/magazine");
  revalidatePath("/magazine/[issueId]", "page");
}

export async function moderateArticleAction(formData: FormData): Promise<void> {
  const actor = await requireActor("magazine", "write");
  const input = articleModerationSchema.parse(Object.fromEntries(formData));
  const status = input.decision === "APPROVE" ? "APPROVED" : "REJECTED";
  const data: Prisma.ArticleUpdateInput = {
    status,
    issue: input.issueId ? { connect: { id: input.issueId } } : { disconnect: true },
    ...(input.title ? { title: input.title } : {}),
    ...(input.body ? { body: input.body } : {}),
  };
  await db.$transaction(async (tx) => {
    await tx.article.update({ where: { id: input.id }, data });
    await writeAudit(
      {
        actorId: actor.id,
        action: input.decision,
        entity: "Article",
        entityId: input.id,
        after: { status, issueId: input.issueId ?? null } as Prisma.InputJsonValue,
      },
      tx,
    );
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath("/admin/magazine");
  revalidatePath("/magazine");
  revalidatePath("/magazine/[issueId]", "page");
}
