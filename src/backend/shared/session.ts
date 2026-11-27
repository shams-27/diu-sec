import type { Session } from "next-auth";
import type { Actor } from "@/backend/shared/rbac";

export function sessionToActor(session: Session | null): Actor {
  return {
    role: session?.user?.role ?? null,
    wingId: session?.user?.wingId ?? undefined,
  };
}
