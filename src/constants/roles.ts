import type { UserRole } from "@/src/types";

export const ROLES: Record<UserRole, string> = {
  admin: "Administrateur",
  employee: "Employé",
} as const;

export const ROLE_PERMISSIONS = {
  admin: [
    "dashboard:view",
    "clients:view",
    "clients:create",
    "clients:edit",
    "clients:archive",
    "clients:restore",
    "clients:import",
    "clients:export",
    "notes:create",
    "notes:edit",
    "notes:delete",
    "settings:view",
    "settings:edit",
    "users:manage",
  ],
  employee: [
    "dashboard:view",
    "clients:view",
    "clients:create",
    "clients:edit",
    "notes:create",
    "notes:edit",
    "notes:delete",
  ],
} as const;

export type Permission = (typeof ROLE_PERMISSIONS)[UserRole][number];

export function hasPermission(role: UserRole, permission: string): boolean {
  return (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission);
}
