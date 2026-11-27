import { auth } from "@/backend/shared/auth";
import { assertCan, type Action, type Actor, type AdminModule } from "@/backend/shared/rbac";
import { sessionToActor } from "@/backend/shared/session";

export type AdminActor = Actor & { id: string };

export async function requireActor(
  module: AdminModule,
  action: Action,
  resourceWingId?: string | null | "own",
): Promise<AdminActor> {
  const session = await auth();
  const actor = sessionToActor(session);
  const wingId = resourceWingId === "own" ? actor.wingId : resourceWingId;
  assertCan(actor, module, action, wingId);
  return { ...actor, id: session?.user?.id ?? "" };
}
