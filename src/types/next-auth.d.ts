import type { DefaultSession } from "next-auth";
import type { Role } from "@/backend/shared/rbac";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role | null;
      wingId: string | null;
    } & DefaultSession["user"];
  }
}
