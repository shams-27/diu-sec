import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

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
});
