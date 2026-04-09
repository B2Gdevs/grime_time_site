export const CUSTOMER_DASHBOARD_PATH = '/customer/dashboard'
export const LEGACY_CUSTOMER_DASHBOARD_PATH = '/dashboard'
export const OPS_DASHBOARD_PATH = '/ops/dashboard'
export const LEGACY_OPS_DASHBOARD_PATH = '/ops'

export function isCustomerDashboardPath(pathname: null | string | undefined): boolean {
  return pathname === CUSTOMER_DASHBOARD_PATH || pathname === LEGACY_CUSTOMER_DASHBOARD_PATH
}

export function isOpsDashboardPath(pathname: null | string | undefined): boolean {
  return pathname === OPS_DASHBOARD_PATH || pathname === LEGACY_OPS_DASHBOARD_PATH
}
