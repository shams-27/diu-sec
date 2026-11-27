"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { isBot } from "@/lib/honeypot";
import { rateLimited } from "@/lib/rate-limit";
import { contactSchema, type ContactState } from "@/lib/validators";

const TOO_MANY = "Too many submissions. Please try again in a few minutes.";

export async function submitContactAction(_previous: ContactState, formData: FormData): Promise<ContactState> {
  if (isBot(formData)) return { sent: true };
  if (await rateLimited("contact")) return { error: TOO_MANY };

  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check your name, email and message, then try again." };
  const input = parsed.data;
  const data = { name: input.name, email: input.email, message: input.message };
  await db.$transaction(
    async (tx) => {
      const saved = await tx.contactMessage.create({ data });
      await writeAudit(
        {
          actorId: null,
          actorEmail: input.email,
          action: "CREATE",
          entity: "ContactMessage",
          entityId: saved.id,
          after: data as Prisma.InputJsonValue,
        },
        tx,
      );
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  revalidatePath("/contact");
  return { sent: true };
}
