"use server";

import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/backend/shared/admin-guard";
import { writeAudit } from "@/backend/shared/audit";
import { db } from "@/backend/shared/db";
import { projectReviewSchema, projectSchema } from "@/backend/shared/validators";

export async function saveProjectAction(formData: FormData): Promise<void> {
  const actor = await requireActor("projects", "write");
  const input = projectSchema.parse(Object.fromEntries(formData));
  const data = {
    title: input.title,
    description: input.description,
    githubUrl: input.githubUrl,
    demoUrl: input.demoUrl,
    techStack: input.techStack,
    contributors: input.contributors,
    tags: input.tags,
    status: input.status,
    featured: input.featured,
  };
  await db.$transaction(async (tx) => {
    const saved = await tx.project.upsert({
      where: { id: input.id ?? randomUUID() },
      create: data,
      update: data,
    });
    await writeAudit(
      {
        actorId: actor.id,
        action: input.id ? "UPDATE" : "CREATE",
        entity: "Project",
        entityId: saved.id,
        after: data as Prisma.InputJsonValue,
      },
      tx,
    );
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
}

export async function reviewProjectAction(formData: FormData): Promise<void> {
  const actor = await requireActor("projects", "write");
  const input = projectReviewSchema.parse(Object.fromEntries(formData));
  const status = input.decision === "APPROVE" ? "APPROVED" : "REJECTED";
  const featured = status === "APPROVED" && input.featured;
  await db.$transaction(async (tx) => {
    await tx.project.update({ where: { id: input.id }, data: { status, featured } });
    await writeAudit(
      {
        actorId: actor.id,
        action: input.decision,
        entity: "Project",
        entityId: input.id,
        after: { status, featured } as Prisma.InputJsonValue,
      },
      tx,
    );
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
}
