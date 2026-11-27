import { db } from "@/backend/shared/db";

export function getApprovedProjects() {
  return db.project.findMany({
    where: { status: "APPROVED" },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      githubUrl: true,
      demoUrl: true,
      techStack: true,
      contributors: true,
      tags: true,
      featured: true,
    },
  });
}

export function getAllProjects() {
  return db.project.findMany({ orderBy: [{ featured: "desc" }, { createdAt: "desc" }] });
}
