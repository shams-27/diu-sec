import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { encode } from "next-auth/jwt";

const envPath = resolve(process.cwd(), ".env");
const envText = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
function fromEnv(name: string) {
  return process.env[name] ?? envText.match(new RegExp(`^${name}="?([^"\\n]+)"?$`, "m"))?.[1];
}

const secret = fromEnv("AUTH_SECRET");
if (!secret) throw new Error("AUTH_SECRET is required in .env or the environment for e2e tests");

export async function adminCookie(email: string, role: string, wingId?: string | null) {
  return encode({
    secret: secret!,
    salt: "authjs.session-token",
    token: { sub: email, name: "E2E", email, id: email, role, wingId: wingId ?? null },
  });
}

export async function superAdminCookie() {
  const db = new PrismaClient();
  try {
    const admin = await db.user.findFirst({ where: { role: "SUPER_ADMIN" }, select: { email: true } });
    if (!admin) throw new Error("No SUPER_ADMIN in the database; run pnpm prisma db seed");
    return adminCookie(admin.email, "SUPER_ADMIN");
  } finally {
    await db.$disconnect();
  }
}

export function uniqueId() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export async function deleteHomeTestEvents() {
  const db = new PrismaClient();
  try {
    await db.event.deleteMany({ where: { title: { startsWith: "E2E Home Event " } } });
  } finally {
    await db.$disconnect();
  }
}

export async function openEvent() {
  const db = new PrismaClient();
  try {
    const events = await db.event.findMany({
      where: { status: "PUBLISHED", startsAt: { gt: new Date() } },
      select: { id: true, slug: true, capacity: true, seatsTaken: true },
      orderBy: { startsAt: "asc" },
    });
    return events.find((event) => event.capacity > event.seatsTaken);
  } finally {
    await db.$disconnect();
  }
}

export async function webWingId() {
  const db = new PrismaClient();
  try {
    return (await db.wing.findUniqueOrThrow({ where: { slug: "web-mobile-dev" }, select: { id: true } })).id;
  } finally {
    await db.$disconnect();
  }
}
