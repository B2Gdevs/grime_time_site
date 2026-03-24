export const USER_ROLE_OPTIONS = [
  { label: 'Admin', value: 'admin' },
  { label: 'Customer', value: 'customer' },
] as const

export type UserRole = (typeof USER_ROLE_OPTIONS)[number]['value']

export type RoleCarrier =
  | {
      email?: unknown
      id?: unknown
      roles?: null | string | string[]
    }
  | null
  | undefined

function hasRolesField(user: RoleCarrier): user is { roles?: null | string | string[] } {
  return Boolean(user?.roles !== undefined)
}

export function authEntityId(user: RoleCarrier): string | number | null {
  if (!user || typeof user !== 'object' || !('id' in user)) return null

  const { id } = user
  if (typeof id === 'string' || typeof id === 'number') return id

  return null
}

export function authEntityEmail(user: RoleCarrier): string | null {
  if (!user || typeof user !== 'object' || !('email' in user)) return null

  const { email } = user
  return typeof email === 'string' ? email : null
}

function normalizeRoles(user: RoleCarrier): string[] {
  if (!hasRolesField(user) || !user.roles) return []
  if (Array.isArray(user.roles)) return user.roles
  return [user.roles]
}

export function hasUserRole(user: RoleCarrier, role: UserRole): boolean {
  return normalizeRoles(user).includes(role)
}

export function isAdminUser(user: RoleCarrier): boolean {
  return hasUserRole(user, 'admin')
}
