import { db } from "@/backend/shared/db";

export function getFaqs() {
  return db.faq.findMany({
    orderBy: [{ order: "asc" }, { question: "asc" }],
    select: { id: true, question: true, answer: true },
  });
}
