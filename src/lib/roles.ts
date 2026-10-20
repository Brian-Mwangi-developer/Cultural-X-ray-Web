import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, ownerAc } from "better-auth/plugins/organization/access";

// Mirrors backend/src/modules/auth/roles.ts. The backend enforces; this only shapes the UI.
const statement = {
  ...defaultStatements,
  map: ["read", "build"],
  brief: ["read", "write"],
  adCheck: ["read", "run"],
  client: ["add", "disconnect"],
  billing: ["manage"],
} as const;

export const ac = createAccessControl(statement);

const work = { map: ["read", "build"], brief: ["read", "write"], adCheck: ["read", "run"] } as const;

export const roles = {
  owner: ac.newRole({ ...ownerAc.statements, ...work, client: ["add", "disconnect"], billing: ["manage"] }),
  admin: ac.newRole({ ...adminAc.statements, ...work, client: ["add", "disconnect"] }),
  strategist: ac.newRole({ ...work }),
  viewer: ac.newRole({ map: ["read"], brief: ["read"], adCheck: ["read"] }),
};

export type RoleName = keyof typeof roles;
export const INVITABLE_ROLES = ["admin", "strategist", "viewer"] as const satisfies readonly RoleName[];
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export const ROLE_COPY: Record<RoleName, { label: string; can: string }> = {
  owner: { label: "Owner", can: "Everything, including billing and deleting. One per agency or workspace." },
  admin: { label: "Admin", can: "Members, clients and settings. Can't delete or change billing." },
  strategist: { label: "Strategist", can: "Builds maps, writes briefs and runs ad checks for what they're given." },
  viewer: { label: "Viewer", can: "Reads maps and briefs. Good for account managers." },
};

export const roleLabel = (role: string) => ROLE_COPY[role as RoleName]?.label ?? role;
export const isManager = (role: string) => role === "owner" || role === "admin";
