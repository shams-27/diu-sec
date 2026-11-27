export type Role = "SUPER_ADMIN" | "GENERAL_SECRETARY" | "WING_LEAD" | "PUBLICATION_EDITOR";

export type AdminModule =
  | "dashboard" | "members" | "committee" | "wings" | "events" | "certificates"
  | "magazine" | "projects" | "hallOfFame" | "notices" | "resources"
  | "sponsors" | "gallery" | "access" | "audit";

/** none | read | own_read (read, own wing only) | own_write (read/write, own wing only) | write */
export type Access = "none" | "read" | "own_read" | "own_write" | "write";
export type Action = "read" | "write";

const M: Record<AdminModule, Record<Role, Access>> = {
  dashboard:    { SUPER_ADMIN: "read",  GENERAL_SECRETARY: "read",  WING_LEAD: "own_read",  PUBLICATION_EDITOR: "read" },
  members:      { SUPER_ADMIN: "write", GENERAL_SECRETARY: "write", WING_LEAD: "own_read",  PUBLICATION_EDITOR: "none" },
  committee:    { SUPER_ADMIN: "write", GENERAL_SECRETARY: "write", WING_LEAD: "none",      PUBLICATION_EDITOR: "none" },
  wings:        { SUPER_ADMIN: "write", GENERAL_SECRETARY: "write", WING_LEAD: "own_write", PUBLICATION_EDITOR: "none" },
  events:       { SUPER_ADMIN: "write", GENERAL_SECRETARY: "write", WING_LEAD: "own_write", PUBLICATION_EDITOR: "none" },
  certificates: { SUPER_ADMIN: "write", GENERAL_SECRETARY: "write", WING_LEAD: "own_write", PUBLICATION_EDITOR: "none" },
  magazine:     { SUPER_ADMIN: "write", GENERAL_SECRETARY: "write", WING_LEAD: "none",      PUBLICATION_EDITOR: "write" },
  projects:     { SUPER_ADMIN: "write", GENERAL_SECRETARY: "write", WING_LEAD: "write",     PUBLICATION_EDITOR: "write" },
  hallOfFame:   { SUPER_ADMIN: "write", GENERAL_SECRETARY: "write", WING_LEAD: "none",      PUBLICATION_EDITOR: "write" },
  notices:      { SUPER_ADMIN: "write", GENERAL_SECRETARY: "write", WING_LEAD: "none",      PUBLICATION_EDITOR: "write" },
  resources:    { SUPER_ADMIN: "write", GENERAL_SECRETARY: "write", WING_LEAD: "write",     PUBLICATION_EDITOR: "none" },
  sponsors:     { SUPER_ADMIN: "write", GENERAL_SECRETARY: "write", WING_LEAD: "none",      PUBLICATION_EDITOR: "none" },
  gallery:      { SUPER_ADMIN: "write", GENERAL_SECRETARY: "write", WING_LEAD: "none",      PUBLICATION_EDITOR: "write" },
  access:       { SUPER_ADMIN: "write", GENERAL_SECRETARY: "none",  WING_LEAD: "none",      PUBLICATION_EDITOR: "none" },
  audit:        { SUPER_ADMIN: "read",  GENERAL_SECRETARY: "read",  WING_LEAD: "none",      PUBLICATION_EDITOR: "none" },
};

export interface Actor {
  role: Role | null | undefined;
  wingId?: string | null;
}

/**
 * Server-side permission check. For own_* access pass `resourceWingId`
 * (the wing that owns the target record); it must equal actor.wingId.
 */
export function can(
  actor: Actor,
  module: AdminModule,
  action: Action,
  resourceWingId?: string | null,
): boolean {
  if (!actor.role) return false;
  const level = M[module][actor.role];
  switch (level) {
    case "none":
      return false;
    case "read":
      return action === "read";
    case "write":
      return true;
    case "own_read":
      return action === "read" && !!actor.wingId && (resourceWingId == null || resourceWingId === actor.wingId);
    case "own_write":
      return !!actor.wingId && (resourceWingId == null || resourceWingId === actor.wingId);
  }
}

export class ForbiddenError extends Error {
  constructor(msg = "Forbidden") {
    super(msg);
    this.name = "ForbiddenError";
  }
}

export function assertCan(actor: Actor, module: AdminModule, action: Action, resourceWingId?: string | null) {
  if (!can(actor, module, action, resourceWingId)) throw new ForbiddenError();
}
