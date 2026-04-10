import {
  accountPortalAccessModeOptions,
  accountBillingModeOptions,
} from '@/lib/billing/constants'
import { formatDate } from '@/lib/customers/format'
import {
  ORGANIZATION_KIND_OPTIONS,
  ORGANIZATION_MEMBERSHIP_ROLE_OPTIONS,
  deriveOrganizationEntitlements,
  normalizeOrganizationEntitlementList,
  resolveOrganizationEntitlements,
} from '@/lib/auth/organizationRoles'
import { CRM_ACCOUNT_STATUS_OPTIONS, CRM_ACCOUNT_TYPE_OPTIONS } from '@/lib/crm/schema'
import { relationId } from '@/lib/crm/internal/relationship'
import { PORTAL_INVITE_STATE_OPTIONS } from '@/lib/auth/portal-access/constants'

type RelationCarrier = null | number | string | { id?: null | number | string }

type AccountLike = {
  accountType?: null | string
  billingEmail?: null | string
  billingMode?: null | string
  customerUser?: RelationCarrier | UserLike
  id?: null | number | string
  name?: null | string
  owner?: RelationCarrier | UserLike
  portalAccessMode?: null | string
  status?: null | string
  stripeCustomerID?: null | string
  updatedAt?: null | string
}

type MembershipLike = {
  entitlementLocks?: unknown
  clerkMembershipID?: null | string
  id?: null | number | string
  lastSyncedAt?: null | string
  organization?: OrganizationLike | RelationCarrier
  roleTemplate?: null | string
  status?: null | string
  syncSource?: null | string
  user?: RelationCarrier | UserLike
}

type OrganizationLike = {
  id?: null | number | string
  kind?: null | string
  name?: null | string
  provider?: null | string
  slug?: null | string
  status?: null | string
}

type UserLike = {
  account?: AccountLike | RelationCarrier
  clerkUserID?: null | string
  createdAt?: null | string
  email?: null | string
  id?: null | number | string
  lastPortalLoginAt?: null | string
  name?: null | string
  portalInviteState?: null | string
  roles?: null | string | string[]
  supabaseAuthUserID?: null | string
  updatedAt?: null | string
}

export type OpsAdminMetricCard = {
  compact?: boolean
  description?: string
  footer?: string
  title: string
  tone?: 'down' | 'up'
  trend: string
  value: string
}

export type OpsUserMembershipSummary = {
  baselineEntitlements: string[]
  clerkMembershipLinked: boolean
  effectiveEntitlements: string[]
  entitlementLocks: string[]
  id: string
  kind: string
  lastSyncedAt: null | string
  organizationId: null | string
  organizationName: string
  organizationSlug: string
  organizationStatus: string
  provider: string
  roleTemplate: string
  status: string
  syncSource: string
}

export type OpsUserDirectoryRow = {
  accountId: null | string
  accountName: null | string
  createdAt: null | string
  customerRoleTemplates: string[]
  email: string
  entitlements: string[]
  hasClerkLink: boolean
  hasPayloadAdminAccess: boolean
  hasSupabaseLink: boolean
  id: string
  lastPortalLoginAt: null | string
  memberships: OpsUserMembershipSummary[]
  name: string
  payloadRoles: string[]
  portalInviteState: string
  scope: 'customer' | 'hybrid' | 'staff' | 'unassigned'
  staffRoleTemplates: string[]
}

export type OpsUsersPageData = {
  cards: OpsAdminMetricCard[]
  rows: OpsUserDirectoryRow[]
}

export type OpsCustomerLinkedUser = {
  email: string
  hasClerkLink: boolean
  hasPortalAccess: boolean
  id: string
  name: string
}

export type OpsCustomerDirectoryRow = {
  accountType: string
  billingEmail: null | string
  billingMode: string
  id: string
  linkedUsers: OpsCustomerLinkedUser[]
  name: string
  ownerName: null | string
  portalAccessMode: string
  primaryCustomerUserId: null | string
  primaryCustomerEmail: null | string
  primaryCustomerName: null | string
  status: string
  stripeCustomerLinked: boolean
  updatedAt: null | string
}

export type OpsCustomersPageData = {
  cards: OpsAdminMetricCard[]
  rows: OpsCustomerDirectoryRow[]
}

const countFormatter = new Intl.NumberFormat('en-US')

const accountStatusLabels = buildLabelMap(CRM_ACCOUNT_STATUS_OPTIONS)
const accountTypeLabels = buildLabelMap(CRM_ACCOUNT_TYPE_OPTIONS)
const billingModeLabels = buildLabelMap(accountBillingModeOptions)
const inviteStateLabels = buildLabelMap(PORTAL_INVITE_STATE_OPTIONS)
const organizationKindLabels = buildLabelMap(ORGANIZATION_KIND_OPTIONS)
const portalAccessModeLabels = buildLabelMap(accountPortalAccessModeOptions)
const roleTemplateLabels = buildLabelMap(ORGANIZATION_MEMBERSHIP_ROLE_OPTIONS)

function buildLabelMap(options: ReadonlyArray<{ label: string; value: string }>): Map<string, string> {
  return new Map(options.map((option) => [option.value, option.label]))
}

function formatCount(value: number): string {
  return countFormatter.format(value)
}

function normalizeRoleList(roles: null | string | string[] | undefined): string[] {
  if (Array.isArray(roles)) {
    return roles.filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
  }

  return typeof roles === 'string' && roles.trim().length > 0 ? [roles] : []
}

function toStringId(value: RelationCarrier | undefined): null | string {
  const id = relationId(value)
  if (id === null || id === undefined) {
    return null
  }

  return String(id)
}

function resolveAccount(value: RelationCarrier | AccountLike | undefined): AccountLike | null {
  if (!value || typeof value !== 'object' || !('name' in value || 'billingEmail' in value)) {
    return null
  }

  return value as AccountLike
}

function resolveOrganization(value: MembershipLike['organization']): OrganizationLike | null {
  if (!value || typeof value !== 'object' || !('name' in value || 'slug' in value || 'kind' in value)) {
    return null
  }

  return value as OrganizationLike
}

function resolveUser(value: RelationCarrier | UserLike | undefined): UserLike | null {
  if (!value || typeof value !== 'object' || !('email' in value || 'name' in value)) {
    return null
  }

  return value as UserLike
}

function fallbackLabel(value: null | string | undefined): string {
  if (!value) return 'Not set'

  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function labelFor(map: Map<string, string>, value: null | string | undefined): string {
  if (!value) return 'Not set'
  return map.get(value) ?? fallbackLabel(value)
}

function normalizeName(name: null | string | undefined, fallback: string): string {
  return name?.trim() || fallback
}

function membershipScope(membership: OpsUserMembershipSummary): 'customer' | 'staff' {
  if (membership.kind === 'staff' || membership.roleTemplate.startsWith('staff-')) {
    return 'staff'
  }

  return 'customer'
}

function deriveUserScope(row: {
  accountName: null | string
  memberships: OpsUserMembershipSummary[]
  payloadRoles: string[]
}): OpsUserDirectoryRow['scope'] {
  const scopes = new Set<OpsUserDirectoryRow['scope']>()

  if (row.accountName) {
    scopes.add('customer')
  }

  if (row.payloadRoles.includes('admin')) {
    scopes.add('staff')
  }

  row.memberships.forEach((membership) => {
    scopes.add(membershipScope(membership))
  })

  if (scopes.has('staff') && scopes.has('customer')) return 'hybrid'
  if (scopes.has('staff')) return 'staff'
  if (scopes.has('customer')) return 'customer'

  return 'unassigned'
}

function buildUserMembershipSummary(membership: MembershipLike): OpsUserMembershipSummary {
  const organization = resolveOrganization(membership.organization)
  const baselineEntitlements = deriveOrganizationEntitlements(membership.roleTemplate)
  const entitlementLocks = normalizeOrganizationEntitlementList(membership.entitlementLocks)
  const effectiveEntitlements = resolveOrganizationEntitlements({
    entitlementLocks,
    roleTemplate: membership.roleTemplate,
  })

  return {
    baselineEntitlements,
    clerkMembershipLinked: Boolean(membership.clerkMembershipID?.trim()),
    effectiveEntitlements,
    entitlementLocks,
    id: String(membership.id ?? `${relationId(membership.user) ?? 'user'}-${relationId(membership.organization) ?? 'org'}`),
    kind: organization?.kind ?? 'customer',
    lastSyncedAt: membership.lastSyncedAt ?? null,
    organizationId: toStringId(membership.organization),
    organizationName: normalizeName(organization?.name, organization?.slug?.trim() || 'Organization'),
    organizationSlug: organization?.slug?.trim() || 'organization',
    organizationStatus: organization?.status ?? 'active',
    provider: organization?.provider ?? 'app',
    roleTemplate: membership.roleTemplate ?? 'customer-member',
    status: membership.status ?? 'active',
    syncSource: membership.syncSource ?? 'app',
  }
}

export function buildOpsUsersPageData(args: {
  memberships: MembershipLike[]
  users: UserLike[]
}): OpsUsersPageData {
  const membershipsByUserId = new Map<string, OpsUserMembershipSummary[]>()

  args.memberships.forEach((membership) => {
    const userId = toStringId(membership.user)
    if (!userId) return

    const nextMembership = buildUserMembershipSummary(membership)
    const existing = membershipsByUserId.get(userId)

    if (existing) {
      existing.push(nextMembership)
      return
    }

    membershipsByUserId.set(userId, [nextMembership])
  })

  const rows = args.users
    .map((user) => {
      const email = user.email?.trim().toLowerCase() || 'Unknown email'
      const account = resolveAccount(user.account)
      const accountId = toStringId(user.account)
      const memberships = [...(membershipsByUserId.get(String(user.id ?? email)) ?? [])].sort((left, right) =>
        left.organizationName.localeCompare(right.organizationName),
      )
      const effectiveMemberships = memberships.filter((membership) => membership.status === 'active')
      const entitlements = Array.from(
        new Set(effectiveMemberships.flatMap((membership) => membership.effectiveEntitlements)),
      ).sort()
      const payloadRoles = normalizeRoleList(user.roles).sort()
      const row: OpsUserDirectoryRow = {
        accountId,
        accountName: account?.name?.trim() || null,
        createdAt: user.createdAt ?? null,
        customerRoleTemplates: memberships
          .filter((membership) => membershipScope(membership) === 'customer')
          .map((membership) => membership.roleTemplate),
        email,
        entitlements,
        hasClerkLink: Boolean(user.clerkUserID?.trim()),
        hasPayloadAdminAccess:
          payloadRoles.includes('admin') || entitlements.includes('admin:payload'),
        hasSupabaseLink: Boolean(user.supabaseAuthUserID?.trim()),
        id: String(user.id ?? email),
        lastPortalLoginAt: user.lastPortalLoginAt ?? null,
        memberships,
        name: normalizeName(user.name, email),
        payloadRoles,
        portalInviteState: user.portalInviteState ?? 'none',
        scope: 'unassigned',
        staffRoleTemplates: memberships
          .filter((membership) => membershipScope(membership) === 'staff')
          .map((membership) => membership.roleTemplate),
      }

      row.scope = deriveUserScope(row)

      return row
    })
    .sort((left, right) => left.name.localeCompare(right.name))

  const totalUsers = rows.length
  const staffUsers = rows.filter((row) => row.scope === 'staff' || row.scope === 'hybrid').length
  const customerUsers = rows.filter((row) => row.scope === 'customer' || row.scope === 'hybrid').length
  const pendingUsers = rows.filter((row) =>
    ['claim_pending', 'invite_pending'].includes(row.portalInviteState),
  ).length

  return {
    cards: [
      {
        description: 'People with a first-party Grime Time identity record.',
        footer: `${rows.filter((row) => row.hasClerkLink).length} linked to Clerk`,
        title: 'Users',
        trend: 'First-party identity directory',
        value: formatCount(totalUsers),
      },
      {
        description: 'Staff-capable users based on memberships or admin roles.',
        footer: `${rows.filter((row) => row.hasPayloadAdminAccess).length} can reach admin-grade tooling`,
        title: 'Staff access',
        trend: 'Ops and content team slice',
        value: formatCount(staffUsers),
      },
      {
        description: 'Customer-facing users tied to portal access or account ownership.',
        footer: `${rows.filter((row) => row.accountName).length} directly attached to an account`,
        title: 'Customer users',
        trend: 'Portal-ready identity slice',
        value: formatCount(customerUsers),
      },
      {
        description: 'Users who still need claim or invite completion before they are settled.',
        footer: `${rows.filter((row) => row.lastPortalLoginAt).length} have logged in at least once`,
        title: 'Pending access',
        trend: 'Invite and claim cleanup queue',
        value: formatCount(pendingUsers),
      },
    ],
    rows,
  }
}

export function buildOpsCustomersPageData(args: {
  accounts: AccountLike[]
  users: UserLike[]
}): OpsCustomersPageData {
  const linkedUsersByAccountId = new Map<string, OpsCustomerLinkedUser[]>()

  args.users.forEach((user) => {
    const accountId = toStringId(user.account)
    if (!accountId) return

    const entry: OpsCustomerLinkedUser = {
      email: user.email?.trim().toLowerCase() || 'Unknown email',
      hasClerkLink: Boolean(user.clerkUserID?.trim()),
      hasPortalAccess:
        Boolean(user.lastPortalLoginAt) ||
        user.portalInviteState === 'active' ||
        user.portalInviteState === 'invite_pending' ||
        user.portalInviteState === 'claim_pending',
      id: String(user.id ?? `${accountId}:${user.email ?? 'user'}`),
      name: normalizeName(user.name, user.email?.trim().toLowerCase() || 'Unknown user'),
    }

    const existing = linkedUsersByAccountId.get(accountId)
    if (existing) {
      existing.push(entry)
      return
    }

    linkedUsersByAccountId.set(accountId, [entry])
  })

  const rows = args.accounts
    .map((account) => {
      const id = String(account.id ?? account.name ?? 'account')
      const primaryCustomer = resolveUser(account.customerUser)
      const owner = resolveUser(account.owner)
      const linkedUsers = [...(linkedUsersByAccountId.get(id) ?? [])].sort((left, right) =>
        left.name.localeCompare(right.name),
      )

      return {
        accountType: account.accountType ?? 'residential',
        billingEmail: account.billingEmail?.trim().toLowerCase() || null,
        billingMode: account.billingMode ?? 'send_invoice_due_on_receipt',
        id,
        linkedUsers,
        name: normalizeName(account.name, 'Account'),
        ownerName: owner?.name?.trim() || owner?.email?.trim().toLowerCase() || null,
        portalAccessMode: account.portalAccessMode ?? 'none',
        primaryCustomerUserId: toStringId(account.customerUser),
        primaryCustomerEmail: primaryCustomer?.email?.trim().toLowerCase() || null,
        primaryCustomerName:
          primaryCustomer?.name?.trim() ||
          primaryCustomer?.email?.trim().toLowerCase() ||
          null,
        status: account.status ?? 'prospect',
        stripeCustomerLinked: Boolean(account.stripeCustomerID?.trim()),
        updatedAt: account.updatedAt ?? null,
      } satisfies OpsCustomerDirectoryRow
    })
    .sort((left, right) => left.name.localeCompare(right.name))

  const activeCustomers = rows.filter((row) => row.status === 'active').length
  const commercialCustomers = rows.filter((row) => row.accountType !== 'residential').length
  const portalEnabledCustomers = rows.filter((row) => row.portalAccessMode !== 'none').length
  const stripeLinkedCustomers = rows.filter((row) => row.stripeCustomerLinked).length

  return {
    cards: [
      {
        description: 'Account records that anchor customers inside the app.',
        footer: `${rows.filter((row) => row.primaryCustomerName).length} have a primary customer user`,
        title: 'Customers',
        trend: 'First-party account directory',
        value: formatCount(rows.length),
      },
      {
        description: 'Accounts already considered active in the CRM lifecycle.',
        footer: `${formatCount(commercialCustomers)} are commercial or multi-site`,
        title: 'Active accounts',
        trend: 'Live customer relationship load',
        value: formatCount(activeCustomers),
      },
      {
        description: 'Accounts configured for app or billing portal access.',
        footer: `${rows.reduce((sum, row) => sum + row.linkedUsers.length, 0)} linked users across the directory`,
        title: 'Portal coverage',
        trend: 'Customer access readiness',
        value: formatCount(portalEnabledCustomers),
      },
      {
        description: 'Accounts already carrying a Stripe customer link.',
        footer: `${rows.filter((row) => row.billingEmail).length} have a billing inbox on file`,
        title: 'Stripe linked',
        trend: 'Billing-provider attachment',
        value: formatCount(stripeLinkedCustomers),
      },
    ],
    rows,
  }
}

export function describeInviteState(value: string): string {
  return labelFor(inviteStateLabels, value)
}

export function describeOrganizationKind(value: string): string {
  return labelFor(organizationKindLabels, value)
}

export function describeRoleTemplate(value: string): string {
  return labelFor(roleTemplateLabels, value)
}

export function describeAccountStatus(value: string): string {
  return labelFor(accountStatusLabels, value)
}

export function describeAccountType(value: string): string {
  return labelFor(accountTypeLabels, value)
}

export function describeBillingMode(value: string): string {
  return labelFor(billingModeLabels, value)
}

export function describePortalAccessMode(value: string): string {
  return labelFor(portalAccessModeLabels, value)
}

export function formatSyncTimestamp(value: null | string): string {
  return value ? formatDate(value) : 'Not synced yet'
}
