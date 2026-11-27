import { auth } from "@/auth";
import { assertCan, type Action, type Actor, type AdminModule } from "@/lib/rbac";
import { sessionToActor } from "@/lib/session";

export type AdminActor = Actor & { id: string };

export async function requireActor(
  module: AdminModule,
  action: Action,
  resourceWingId?: string | null,
): Promise<AdminActor> {
  const session = await auth();
  const actor = sessionToActor(session);
  assertCan(actor, module, action, resourceWingId);
  return { ...actor, id: session?.user?.id ?? "" };
}
