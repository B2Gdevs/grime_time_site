export const CUSTOMER_DASHBOARD_PATH = '/customer/dashboard'
export const LEGACY_CUSTOMER_DASHBOARD_PATH = '/dashboard'
export const OPS_PORTAL_ROOT_PATH = '/portal/ops'
export const LEGACY_OPS_ROOT_PATH = '/ops'
export const OPS_DASHBOARD_PATH = `${OPS_PORTAL_ROOT_PATH}/dashboard`
export const LEGACY_OPS_DASHBOARD_PATH = LEGACY_OPS_ROOT_PATH
export const OPS_WORKSPACE_PATH = `${OPS_PORTAL_ROOT_PATH}/workspace`
export const LEGACY_OPS_WORKSPACE_PATH = `${LEGACY_OPS_ROOT_PATH}/workspace`
export const OPS_USERS_PATH = `${OPS_PORTAL_ROOT_PATH}/users`
export const OPS_CUSTOMERS_PATH = `${OPS_PORTAL_ROOT_PATH}/customers`

function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function isCustomerDashboardPath(pathname: null | string | undefined): boolean {
  return pathname === CUSTOMER_DASHBOARD_PATH || pathname === LEGACY_CUSTOMER_DASHBOARD_PATH
}

export function isOpsPortalPath(pathname: null | string | undefined): boolean {
  if (!pathname) {
    return false
  }

  return pathMatchesPrefix(pathname, OPS_PORTAL_ROOT_PATH) || pathMatchesPrefix(pathname, LEGACY_OPS_ROOT_PATH)
}

export function isOpsDashboardPath(pathname: null | string | undefined): boolean {
  return pathname === OPS_DASHBOARD_PATH || pathname === LEGACY_OPS_DASHBOARD_PATH
}

export function isOpsWorkspacePath(pathname: null | string | undefined): boolean {
  return pathname === OPS_WORKSPACE_PATH || pathname === LEGACY_OPS_WORKSPACE_PATH
}
