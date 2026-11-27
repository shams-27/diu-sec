import { db } from "@/backend/shared/db";

export function getPublishedIssues() {
  return db.magazineIssue.findMany({
    where: { publishedAt: { not: null } },
    orderBy: [{ featured: "desc" }, { number: "desc" }],
    select: {
      id: true,
      number: true,
      title: true,
      coverUrl: true,
      featured: true,
      publishedAt: true,
    },
  });
}

export function getPublishedIssueById(issueId: string) {
  return db.magazineIssue.findFirst({
    where: { id: issueId, publishedAt: { not: null } },
    include: {
      articles: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" } },
    },
  });
}

export function getMagazineAdminData() {
  return Promise.all([
    db.magazineIssue.findMany({
      orderBy: { number: "desc" },
      include: { _count: { select: { articles: true } } },
    }),
    db.article.findMany({
      where: { status: "SUBMITTED" },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, body: true, authorName: true, issueId: true, createdAt: true },
    }),
  ]);
}
