import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { IMAGE_MIME, MAX_IMAGE_BYTES, MAX_PDF_BYTES } from "@/lib/validators";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/**
 * Saves a validated upload under public/uploads and returns its URL.
 * Local driver only; swapping in S3 later only changes this file.
 */
export async function saveUpload(file: unknown, kind: "image" | "pdf"): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const allowed: readonly string[] = kind === "image" ? IMAGE_MIME : ["application/pdf"];
  if (!allowed.includes(file.type)) throw new Error(`Unsupported ${kind} upload`);
  if (file.size > (kind === "image" ? MAX_IMAGE_BYTES : MAX_PDF_BYTES)) throw new Error(`${kind} is too large`);

  const name = `${randomUUID()}.${EXT[file.type]}`;
  await writeAsset(name, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

/** Stores a generated PDF (certificates) with the same public URL convention. */
export async function saveGeneratedPdf(bytes: Uint8Array): Promise<string> {
  const name = `${randomUUID()}.pdf`;
  await writeAsset(name, bytes);
  return `/uploads/${name}`;
}

/** Best-effort rollback for assets written before a failed DB transaction. */
export async function removeUploadedAsset(url: string): Promise<void> {
  if (!url.startsWith("/uploads/")) return;
  const name = path.basename(url);
  if (!/^[\w.-]+\.(pdf|jpg|png|webp)$/.test(name)) return;
  await unlink(path.join(process.cwd(), "public", "uploads", name)).catch(() => {});
}

async function writeAsset(name: string, bytes: Uint8Array) {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
}
