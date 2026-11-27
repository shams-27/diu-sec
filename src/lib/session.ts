import type { Session } from "next-auth";
import type { Actor } from "@/lib/rbac";

export function sessionToActor(session: Session | null): Actor {
  return {
    role: session?.user?.role ?? null,
    wingId: session?.user?.wingId ?? undefined,
  };
}
