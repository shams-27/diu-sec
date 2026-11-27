import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/backend/shared/rbac";

const e = vi.hoisted(() => ({
  requireActor: vi.fn(),
  writeAudit: vi.fn(),
  projectUpsert: vi.fn(),
  projectUpdate: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/backend/shared/admin-guard", () => ({ requireActor: e.requireActor }));
vi.mock("@/backend/shared/audit", () => ({ writeAudit: e.writeAudit }));
vi.mock("@/backend/shared/db", () => ({
  db: { project: { upsert: e.projectUpsert, update: e.projectUpdate }, $transaction: e.transaction },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));

import { projectReviewSchema, projectSchema } from "@/backend/shared/validators";
import { reviewProjectAction, saveProjectAction } from "@/server/actions/projects";

const fd = (entries: [string, string][]) => {
  const data = new FormData();
  for (const [key, value] of entries) data.set(key, value);
  return data;
};
const projectForm = fd([
  ["title", "CP Tracker"],
  ["description", "A tool for tracking problem-solving practice."],
  ["githubUrl", "https://github.com/diu-sec/cp-tracker"],
  ["techStack", "Next.js\nTypeScript"],
  ["contributors", "Jane Doe\nJohn Roe"],
  ["tags", "cp\nopen-source"],
]);

describe("project validators", () => {
  it("splits newline lists and rejects non-GitHub URLs", () => {
    const parsed = projectSchema.parse(Object.fromEntries(projectForm));
    expect(parsed.techStack).toEqual(["Next.js", "TypeScript"]);
    expect(parsed.tags).toEqual(["cp", "open-source"]);
    expect(projectSchema.safeParse({ ...Object.fromEntries(projectForm), githubUrl: "https://gitlab.com/x/y" }).success).toBe(false);
  });

  it("accepts approve/reject reviews only", () => {
    expect(projectReviewSchema.safeParse({ id: "p1", decision: "FEATURE" }).success).toBe(false);
    expect(projectReviewSchema.parse({ id: "p1", decision: "APPROVE", featured: "on" }).featured).toBe(true);
  });
});

describe("project actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.requireActor.mockResolvedValue({ id: "u1", role: "WING_LEAD", wingId: "w1" });
    e.projectUpsert.mockResolvedValue({ id: "p1" });
    e.projectUpdate.mockResolvedValue({ id: "p1" });
    e.transaction.mockImplementation(async (callback) =>
      callback({ project: { upsert: e.projectUpsert, update: e.projectUpdate } }),
    );
  });

  it("saves a project and audits the create", async () => {
    await saveProjectAction(projectForm);
    expect(e.projectUpsert).toHaveBeenCalled();
    expect(e.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CREATE", entity: "Project" }),
      expect.anything(),
    );
  });

  it("approves and features a project with an audit entry", async () => {
    await reviewProjectAction(fd([["id", "p1"], ["decision", "APPROVE"], ["featured", "on"]]));
    expect(e.projectUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "APPROVED", featured: true }) }),
    );
    expect(e.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "APPROVE", entity: "Project" }),
      expect.anything(),
    );
  });

  it("never features a rejected project", async () => {
    await reviewProjectAction(fd([["id", "p1"], ["decision", "REJECT"], ["featured", "on"]]));
    expect(e.projectUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "REJECTED", featured: false }) }),
    );
  });

  it("propagates an authorization denial without writing", async () => {
    e.requireActor.mockRejectedValueOnce(new ForbiddenError());
    await expect(reviewProjectAction(fd([["id", "p1"], ["decision", "APPROVE"]]))).rejects.toThrow(ForbiddenError);
    expect(e.projectUpdate).not.toHaveBeenCalled();
  });
});
