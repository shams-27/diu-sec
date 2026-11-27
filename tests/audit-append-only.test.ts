import { readFileSync, readdirSync } from "node:fs";
import type { Dirent } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrations = path.join(process.cwd(), "prisma", "migrations");

describe("AuditLog append-only migrations", () => {
  it("blocks TRUNCATE as well as UPDATE and DELETE", () => {
    const sql = readdirSync(migrations, { withFileTypes: true })
      .filter((entry: Dirent) => entry.isDirectory())
      .flatMap((dir) => readdirSync(path.join(migrations, dir.name)).map((file) => path.join(migrations, dir.name, file)))
      .filter((file) => file.endsWith(".sql"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(sql).toMatch(/BEFORE\s+TRUNCATE\s+ON\s+"AuditLog"/i);
  });
});
