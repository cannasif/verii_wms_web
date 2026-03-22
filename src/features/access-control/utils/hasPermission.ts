import type { MyPermissionsDto } from '../types/access-control.types';
import { PATH_TO_PERMISSION_PATTERNS, ACCESS_CONTROL_ADMIN_ONLY_PATTERNS } from './permission-config';

export function hasPermission(
  permissions: MyPermissionsDto | null | undefined,
  requiredCode: string
): boolean {
  if (!permissions) return false;
  if (permissions.isSystemAdmin === true) return true;
  return permissions.permissionCodes.includes(requiredCode);
}

export function resolveRequiredPermission(pathname: string): string | null {
  for (const { pattern, permission } of PATH_TO_PERMISSION_PATTERNS) {
    if (pattern.test(pathname)) {
      return permission;
    }
  }
  return null;
}

export function canAccessPath(
  permissions: MyPermissionsDto | null | undefined,
  pathname: string
): boolean {
  if (!permissions) return false;
  if (ACCESS_CONTROL_ADMIN_ONLY_PATTERNS.some((p) => p.test(pathname))) {
    return permissions.isSystemAdmin === true;
  }
  const required = resolveRequiredPermission(pathname);
  if (!required) return true;
  return hasPermission(permissions, required);
}
