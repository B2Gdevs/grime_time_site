export const ORGANIZATION_KIND_OPTIONS = [
  { label: 'Staff Workspace', value: 'staff' },
  { label: 'Customer Organization', value: 'customer' },
] as const

export type OrganizationKind = (typeof ORGANIZATION_KIND_OPTIONS)[number]['value']

export const ORGANIZATION_PROVIDER_OPTIONS = [
  { label: 'Application', value: 'app' },
  { label: 'Clerk', value: 'clerk' },
  { label: 'Supabase', value: 'supabase' },
] as const

export type OrganizationProvider = (typeof ORGANIZATION_PROVIDER_OPTIONS)[number]['value']

export const ORGANIZATION_MEMBERSHIP_ROLE_OPTIONS = [
  { label: 'Staff Owner', value: 'staff-owner' },
  { label: 'Staff Admin', value: 'staff-admin' },
  { label: 'Staff Operator', value: 'staff-operator' },
  { label: 'Customer Admin', value: 'customer-admin' },
  { label: 'Customer Member', value: 'customer-member' },
] as const

export type OrganizationMembershipRoleTemplate =
  (typeof ORGANIZATION_MEMBERSHIP_ROLE_OPTIONS)[number]['value']

export const ORGANIZATION_ENTITLEMENT_OPTIONS = [
  { label: 'Payload Admin', value: 'admin:payload' },
  { label: 'CRM Write', value: 'crm:write' },
  { label: 'Ops Write', value: 'ops:write' },
  { label: 'Content Write', value: 'content:write' },
  { label: 'Billing Write', value: 'billing:write' },
  { label: 'Organization Manage', value: 'org:manage' },
  { label: 'Membership Manage', value: 'org:manage-members' },
  { label: 'Impersonation Use', value: 'impersonation:use' },
  { label: 'Portal Access', value: 'portal:access' },
] as const

export type OrganizationEntitlement = (typeof ORGANIZATION_ENTITLEMENT_OPTIONS)[number]['value']

const membershipEntitlements: Record<
  OrganizationMembershipRoleTemplate,
  OrganizationEntitlement[]
> = {
  'customer-admin': ['portal:access'],
  'customer-member': ['portal:access'],
  'staff-admin': [
    'admin:payload',
    'billing:write',
    'content:write',
    'crm:write',
    'impersonation:use',
    'ops:write',
    'org:manage-members',
  ],
  'staff-operator': [
    'admin:payload',
    'content:write',
    'crm:write',
    'impersonation:use',
    'ops:write',
  ],
  'staff-owner': [
    'admin:payload',
    'billing:write',
    'content:write',
    'crm:write',
    'impersonation:use',
    'ops:write',
    'org:manage',
    'org:manage-members',
  ],
}

export function deriveOrganizationEntitlements(
  roleTemplate: null | OrganizationMembershipRoleTemplate | string | undefined,
): OrganizationEntitlement[] {
  if (!roleTemplate || !(roleTemplate in membershipEntitlements)) {
    return []
  }

  return membershipEntitlements[roleTemplate as OrganizationMembershipRoleTemplate]
}

export function roleTemplateHasPayloadAdminAccess(
  roleTemplate: null | OrganizationMembershipRoleTemplate | string | undefined,
): boolean {
  return deriveOrganizationEntitlements(roleTemplate).includes('admin:payload')
}

export function roleTemplateCanManageOrganizations(
  roleTemplate: null | OrganizationMembershipRoleTemplate | string | undefined,
): boolean {
  return deriveOrganizationEntitlements(roleTemplate).includes('org:manage')
}

export function roleTemplateCanManageMemberships(
  roleTemplate: null | OrganizationMembershipRoleTemplate | string | undefined,
): boolean {
  return deriveOrganizationEntitlements(roleTemplate).includes('org:manage-members')
}
