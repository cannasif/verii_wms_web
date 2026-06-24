export interface OperationUserLike {
  fullName?: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string;
  email?: string;
}

export function getOperationUserDisplayName(user: OperationUserLike): string {
  return (
    user.fullName ||
    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
    user.username ||
    ''
  );
}

export function getOperationUserSubtitle(user: OperationUserLike): string | undefined {
  return user.email || undefined;
}

export function getOperationUserInitials(user: OperationUserLike): string {
  const name = getOperationUserDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
