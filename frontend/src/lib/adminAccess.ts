export type AuthUserLike = {
  role?: string | number | null;
  status?: string | number | null;
} | null | undefined;

export function isAdminRole(role: string | number | null | undefined) {
  return role === 'ADMIN' || role === '100' || role === 100;
}

export function isEnabledAccount(status: string | number | null | undefined) {
  return status === undefined || status === null || status === 'ACTIVE' || status === '1' || status === 1;
}

export function isAdminUser(user: AuthUserLike) {
  return !!user && isAdminRole(user.role) && isEnabledAccount(user.status);
}

export function getPostLoginPath(user: AuthUserLike) {
  return isAdminUser(user) ? '/admin' : '/dashboard';
}
