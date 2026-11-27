import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function filesIn(dir: string): string[] {
  const base = join(root, dir);
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? filesIn(join(dir, entry.name))
      : [join(dir, entry.name)],
  );
}

function sourceFilesIn(dir: string): string[] {
  return filesIn(dir).filter((file) => /\.(ts|tsx|mts)$/.test(file));
}

describe("frontend/backend layers", () => {
  it("has the shared module layout", () => {
    for (const path of [
      "src/frontend/shared/ui/button.tsx",
      "src/frontend/shared/shell/site-header.tsx",
      "src/backend/shared/db.ts",
      "src/backend/shared/validators.ts",
      "src/frontend/features/home/home-page.tsx",
    ]) {
      expect(existsSync(join(root, path)), path).toBe(true);
    }
  });

  it("defines both layer aliases in TypeScript and Vitest", () => {
    for (const file of ["tsconfig.json", "vitest.config.mts"]) {
      const source = readFileSync(join(root, file), "utf8");
      expect(source, file).toMatch(/@\/frontend(\/\*)?/);
      expect(source, file).toMatch(/@\/backend(\/\*)?/);
    }
  });

  it("keeps backend free of frontend imports", () => {
    for (const file of sourceFilesIn("src/backend")) {
      const source = readFileSync(join(root, file), "utf8");
      expect(source, file).not.toContain("@/frontend");
    }
  });

  it("has one backend feature folder per domain", () => {
    for (const domain of [
      "membership",
      "certificates",
      "committee",
      "wings",
      "events",
      "magazine",
      "hall-of-fame",
      "projects",
      "notices",
      "resources",
      "partners",
      "gallery",
      "contact",
      "access",
      "audit",
    ]) {
      expect(existsSync(join(root, "src/backend/features", domain)), domain).toBe(true);
    }
  });

  it("has no legacy layer imports", () => {
    for (const file of sourceFilesIn("src")) {
      const source = readFileSync(join(root, file), "utf8");
      expect(source, file).not.toContain("@/server/actions/");
      expect(source, file).not.toContain("@/lib/");
    }
  });

  it("keeps database access out of the frontend", () => {
    for (const file of sourceFilesIn("src/frontend")) {
      const source = readFileSync(join(root, file), "utf8");
      expect(source, file).not.toMatch(/@\/backend\/shared\/(auth|db)\b/);
      expect(source, file).not.toMatch(/\.\.\/.*backend\//);
      expect(source, file).not.toContain("@prisma/client");
      expect(source, file).not.toContain("PrismaClient");
    }
  });

  it("moves every component into a feature folder", () => {
    expect(filesIn("src/components").filter((file) => file.endsWith(".tsx"))).toEqual([]);
  });

  it("keeps route files thin with a feature re-export", () => {
    for (const file of sourceFilesIn("src/app").filter((file) => file.endsWith("page.tsx"))) {
      const source = readFileSync(join(root, file), "utf8");
      expect(source, file).toContain('as default } from "@/frontend/features/');
      expect(source, file).not.toContain("prisma.");
    }
  });
});
