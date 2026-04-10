'use client'

import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  BadgeCheckIcon,
  Building2Icon,
  KeyRoundIcon,
  LockIcon,
  LockOpenIcon,
  LoaderCircleIcon,
  Link2Icon,
  MailPlusIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
  ShieldIcon,
  UserRoundIcon,
  UsersIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { SectionCards } from '@/components/section-cards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { OpsUsersPageData, OpsUserDirectoryRow } from '@/lib/ops/loaders/opsAdminData'
import {
  describeInviteState,
  describeOrganizationKind,
  describeRoleTemplate,
  formatSyncTimestamp,
} from '@/lib/ops/loaders/opsAdminData'
import { requestJson } from '@/lib/query/request'

const scopeOptions = [
  { label: 'All users', value: 'all' },
  { label: 'Staff only', value: 'staff' },
  { label: 'Customer only', value: 'customer' },
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'Needs assignment', value: 'unassigned' },
] as const

const staffRoleOptions = [
  { label: 'Staff Owner', value: 'staff-owner' },
  { label: 'Staff Admin', value: 'staff-admin' },
  { label: 'Staff Designer', value: 'staff-designer' },
  { label: 'Staff Operator', value: 'staff-operator' },
] as const

function filterUserRows(args: {
  inviteState: string
  query: string
  rows: OpsUserDirectoryRow[]
  scope: string
}) {
  const normalizedQuery = args.query.trim().toLowerCase()

  return args.rows.filter((row) => {
    if (args.scope !== 'all' && row.scope !== args.scope) {
      return false
    }

    if (args.inviteState !== 'all' && row.portalInviteState !== args.inviteState) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    const haystack = [
      row.name,
      row.email,
      row.accountName,
      row.scope,
      ...row.payloadRoles,
      ...row.staffRoleTemplates,
      ...row.customerRoleTemplates,
      ...row.memberships.map((membership) => membership.organizationName),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedQuery)
  })
}

function scopeBadgeTone(scope: OpsUserDirectoryRow['scope']): 'default' | 'outline' | 'secondary' {
  if (scope === 'staff') return 'default'
  if (scope === 'hybrid') return 'secondary'
  return 'outline'
}

function scopeLabel(scope: OpsUserDirectoryRow['scope']) {
  switch (scope) {
    case 'customer':
      return 'Customer'
    case 'hybrid':
      return 'Hybrid'
    case 'staff':
      return 'Staff'
    default:
      return 'Needs assignment'
  }
}

function describeMembershipStatus(status: null | string | undefined) {
  switch (status) {
    case 'active':
      return 'Active'
    case 'revoked':
      return 'Revoked'
    case 'suspended':
      return 'Suspended'
    default:
      return 'Not attached'
  }
}

function membershipStatusTone(status: null | string | undefined): 'default' | 'destructive' | 'outline' | 'secondary' {
  switch (status) {
    case 'active':
      return 'default'
    case 'suspended':
      return 'secondary'
    case 'revoked':
      return 'destructive'
    default:
      return 'outline'
  }
}

export function OpsUsersPageView({ data }: { data: OpsUsersPageData }) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [scope, setScope] = React.useState('all')
  const [inviteState, setInviteState] = React.useState('all')
  const deferredQuery = React.useDeferredValue(query)
  const filteredRows = filterUserRows({
    inviteState,
    query: deferredQuery,
    rows: data.rows,
    scope,
  })
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(
    filteredRows[0]?.id ?? data.rows[0]?.id ?? null,
  )
  const selectedUser =
    filteredRows.find((row) => row.id === selectedUserId) ?? filteredRows[0] ?? null
  const selectedStaffMembership =
    selectedUser?.memberships.find((membership) => membership.kind === 'staff') ?? null
  const currentStaffRoleTemplate =
    selectedStaffMembership?.roleTemplate ?? 'staff-operator'
  const [staffRoleTemplate, setStaffRoleTemplate] = React.useState(currentStaffRoleTemplate)

  const actionMutation = useMutation({
    mutationFn: async (action: {
      action:
        | 'lock_staff_entitlement'
        | 'reactivate_staff_access'
        | 'resync_provider'
        | 'revoke_staff_invite'
        | 'suspend_staff_access'
        | 'unlock_staff_entitlement'
      entitlement?: string
    } | { action: 'send_staff_invite' | 'update_staff_role'; roleTemplate: string }) => {
      if (!selectedUser?.id) {
        throw new Error('Pick a user first.')
      }

      return requestJson<{ message: string }>(`/api/internal/ops/users/${selectedUser.id}`, {
        body: JSON.stringify(action),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to update staff access.')
    },
    onSuccess: async (body) => {
      toast.success(body.message)
      router.refresh()
    },
  })

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedUserId(null)
      return
    }

    if (!selectedUserId || !filteredRows.some((row) => row.id === selectedUserId)) {
      setSelectedUserId(filteredRows[0]?.id ?? null)
    }
  }, [filteredRows, selectedUserId])

  React.useEffect(() => {
    setStaffRoleTemplate(currentStaffRoleTemplate)
  }, [currentStaffRoleTemplate, selectedUser?.id])

  const inviteActionLabel = selectedUser?.hasClerkLink
    ? 'Grant staff access'
    : selectedUser?.portalInviteState === 'invite_pending'
      ? 'Reissue invite'
      : 'Send invite'
  const canRevokeInvite = selectedUser?.portalInviteState === 'invite_pending'
  const canResyncProvider = Boolean(selectedUser?.hasClerkLink)
  const canSuspendStaffAccess =
    Boolean(selectedStaffMembership) && selectedStaffMembership?.status === 'active'
  const canReactivateStaffAccess =
    Boolean(selectedStaffMembership) &&
    (selectedStaffMembership?.status === 'suspended' || selectedStaffMembership?.status === 'revoked')
  const canManageEntitlementLocks =
    Boolean(selectedStaffMembership) && selectedStaffMembership?.status === 'active'

  return (
    <div className="@container/main flex flex-col gap-6 py-4 md:py-6">
      <section className="px-4 lg:px-6">
        <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-slate-50 shadow-[0_28px_100px_-60px_rgba(8,47,73,0.95)]">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)] lg:p-7">
            <div className="space-y-3">
              <Badge className="border border-sky-400/30 bg-sky-400/10 text-sky-100 hover:bg-sky-400/10">
                Ops identity map
              </Badge>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  Users stay app-owned even when Clerk is doing the auth transport.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-slate-200/88 md:text-base">
                  This directory is the operating view for staff access, customer portal linkage,
                  and role-template review. It keeps identity, memberships, and account attachment
                  visible in one place instead of scattering the truth across provider dashboards.
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-sky-100">
                <ShieldCheckIcon className="size-4" />
                What this page should answer quickly
              </div>
              <ul className="space-y-2 text-sm leading-6 text-slate-200/85">
                <li>Who is staff versus customer versus hybrid.</li>
                <li>Which users still need claim or invite cleanup.</li>
                <li>How role templates and memberships shape access.</li>
                <li>Whether the account-side user linkage is complete.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      <SectionCards items={data.cards} />

      <section className="grid gap-4 px-4 lg:px-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.95fr)]">
        <Card className="overflow-hidden border shadow-sm">
          <CardHeader className="gap-4 border-b border-border/70 bg-muted/20 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Users directory</CardTitle>
                <CardDescription>
                  Search across names, email, accounts, org memberships, and role templates.
                </CardDescription>
              </div>
              <Badge variant="outline" className="rounded-full border-border/70 bg-background/80">
                {filteredRows.length} visible
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1.25fr)_11rem_12rem]">
              <div className="space-y-2">
                <label htmlFor="ops-users-search" className="text-xs font-medium text-muted-foreground">
                  Search users
                </label>
                <Input
                  id="ops-users-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, email, account, or organization"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="ops-users-scope" className="text-xs font-medium text-muted-foreground">
                  User scope
                </label>
                <Select value={scope} onValueChange={setScope}>
                  <SelectTrigger id="ops-users-scope" className="w-full bg-background">
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="ops-users-invite-state" className="text-xs font-medium text-muted-foreground">
                  Invite state
                </label>
                <Select value={inviteState} onValueChange={setInviteState}>
                  <SelectTrigger id="ops-users-invite-state" className="w-full bg-background">
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All states</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="claim_pending">Claim pending</SelectItem>
                    <SelectItem value="invite_pending">Invite pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Scope</TableHead>
                  <TableHead className="hidden lg:table-cell">Account</TableHead>
                  <TableHead className="hidden xl:table-cell">Roles</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length ? (
                  filteredRows.map((row) => {
                    const selected = row.id === selectedUser?.id

                    return (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        data-state={selected ? 'selected' : undefined}
                        onClick={() => setSelectedUserId(row.id)}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{row.name}</div>
                            <div className="text-xs text-muted-foreground">{row.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={scopeBadgeTone(row.scope)}>{scopeLabel(row.scope)}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-sm">{row.accountName || 'No account'}</div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {row.staffRoleTemplates.slice(0, 2).map((role) => (
                              <Badge key={role} variant="secondary" className="rounded-full">
                                {describeRoleTemplate(role)}
                              </Badge>
                            ))}
                            {!row.staffRoleTemplates.length && !row.customerRoleTemplates.length ? (
                              <Badge variant="outline" className="rounded-full">
                                No memberships
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className="rounded-full">
                              {describeInviteState(row.portalInviteState)}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {row.lastPortalLoginAt ? 'Has logged in' : 'No portal login yet'}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                      No users match the current search and filter selection.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle>{selectedUser ? selectedUser.name : 'User detail'}</CardTitle>
            <CardDescription>
              {selectedUser
                ? 'Memberships, provider linkage, and entitlement cues for the selected user.'
                : 'Pick a user from the table to inspect their access shape.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5 p-5">
            {selectedUser ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailStat
                    icon={UsersIcon}
                    label="Scope"
                    value={scopeLabel(selectedUser.scope)}
                  />
                  <DetailStat
                    icon={UserRoundIcon}
                    label="Invite state"
                    value={describeInviteState(selectedUser.portalInviteState)}
                  />
                  <DetailStat
                    icon={Building2Icon}
                    label="Linked account"
                    value={selectedUser.accountName || 'None yet'}
                  />
                  <DetailStat
                    icon={BadgeCheckIcon}
                    label="Portal login"
                    value={selectedUser.lastPortalLoginAt ? 'Seen before' : 'Not yet'}
                  />
                  <DetailStat
                    icon={ShieldCheckIcon}
                    label="Staff access"
                    value={describeMembershipStatus(selectedStaffMembership?.status)}
                  />
                </div>

                <div className="grid gap-2 rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Link2Icon className="size-4 text-muted-foreground" />
                    Provider linkage
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={selectedUser.hasClerkLink ? 'default' : 'outline'}
                      className="rounded-full"
                    >
                      Clerk {selectedUser.hasClerkLink ? 'linked' : 'not linked'}
                    </Badge>
                    <Badge
                      variant={selectedUser.hasSupabaseLink ? 'secondary' : 'outline'}
                      className="rounded-full"
                    >
                      Supabase {selectedUser.hasSupabaseLink ? 'linked' : 'not linked'}
                    </Badge>
                    <Badge
                      variant={selectedUser.hasPayloadAdminAccess ? 'default' : 'outline'}
                      className="rounded-full"
                    >
                      Payload admin {selectedUser.hasPayloadAdminAccess ? 'enabled' : 'not enabled'}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-2 rounded-2xl border border-border/70 bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ShieldIcon className="size-4 text-muted-foreground" />
                    Memberships
                  </div>
                  {selectedUser.memberships.length ? (
                    <div className="grid gap-3">
                      {selectedUser.memberships.map((membership) => (
                        <div
                          key={membership.id}
                          className="rounded-2xl border border-border/70 bg-muted/30 p-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium">{membership.organizationName}</div>
                            <Badge variant="outline" className="rounded-full">
                              {describeOrganizationKind(membership.kind)}
                            </Badge>
                            <Badge
                              variant={membershipStatusTone(membership.status)}
                              className="rounded-full"
                            >
                              {describeMembershipStatus(membership.status)}
                            </Badge>
                            <Badge variant="secondary" className="rounded-full">
                              {describeRoleTemplate(membership.roleTemplate)}
                            </Badge>
                          </div>
                          <div className="mt-2 text-xs leading-5 text-muted-foreground">
                            {membership.provider.toUpperCase()} org · {membership.syncSource} sync ·{' '}
                            {membership.organizationStatus}
                            {' · '}
                            {membership.clerkMembershipLinked ? 'Clerk membership linked' : 'App-only membership'}
                            {' · '}
                            {formatSyncTimestamp(membership.lastSyncedAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No organization memberships are attached yet.
                    </div>
                  )}
                </div>

                <div className="grid gap-2 rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <KeyRoundIcon className="size-4 text-muted-foreground" />
                    Effective entitlements
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.entitlements.length ? (
                      selectedUser.entitlements.map((entitlement) => (
                        <Badge key={entitlement} variant="outline" className="rounded-full">
                          {entitlement}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No explicit org entitlements derived yet.
                      </span>
                    )}
                  </div>
                  {selectedStaffMembership?.entitlementLocks.length ? (
                    <div className="grid gap-2 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-3">
                      <div className="text-xs font-medium uppercase tracking-[0.18em] text-amber-900/80">
                        Locked on this staff membership
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedStaffMembership.entitlementLocks.map((entitlement) => (
                          <Badge
                            key={entitlement}
                            variant="outline"
                            className="rounded-full border-amber-300/80 bg-amber-100/70 text-amber-950"
                          >
                            {entitlement}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 rounded-[1.75rem] border border-slate-800/80 bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.22),transparent_46%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.95))] p-4 text-slate-50 shadow-[0_24px_90px_-56px_rgba(2,132,199,0.9)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-200/80">
                        Staff controls
                      </div>
                      <div className="text-base font-semibold">
                        Invite, role, and provider sync in one place
                      </div>
                      <p className="max-w-xl text-sm leading-6 text-slate-200/78">
                        Clerk handles the auth transport. Grime Time keeps the durable staff role
                        template and membership state here.
                      </p>
                    </div>
                    <Badge className="rounded-full border border-sky-300/20 bg-sky-300/10 text-sky-100 hover:bg-sky-300/10">
                      {selectedUser.hasClerkLink ? 'Clerk-linked user' : 'Invite required'}
                    </Badge>
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Role template</div>
                        <p className="text-sm leading-6 text-slate-300/75">
                          This first-party role stays authoritative even when Clerk only knows a
                          broader member versus admin role.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="ops-users-staff-role"
                          className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300/72"
                        >
                          Staff role
                        </label>
                        <Select value={staffRoleTemplate} onValueChange={setStaffRoleTemplate}>
                          <SelectTrigger
                            id="ops-users-staff-role"
                            className="border-white/10 bg-slate-950/40 text-slate-50"
                          >
                            <SelectValue placeholder="Choose a staff role" />
                          </SelectTrigger>
                          <SelectContent>
                            {staffRoleOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="justify-start bg-sky-500 text-slate-950 hover:bg-sky-400"
                        disabled={actionMutation.isPending || !selectedUser}
                        onClick={() =>
                          actionMutation.mutate({
                            action: 'update_staff_role',
                            roleTemplate: staffRoleTemplate,
                          })
                        }
                        type="button"
                      >
                        {actionMutation.isPending ? (
                          <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
                        ) : null}
                        Save role template
                      </Button>

                      <div className="grid gap-3 rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Entitlement locks</div>
                          <p className="text-sm leading-6 text-slate-300/75">
                            Narrow one staff membership without changing the shared role template.
                          </p>
                        </div>
                        {selectedStaffMembership?.baselineEntitlements.length ? (
                          <div className="grid gap-2">
                            {selectedStaffMembership.baselineEntitlements.map((entitlement) => {
                              const locked = selectedStaffMembership.entitlementLocks.includes(entitlement)

                              return (
                                <Button
                                  key={entitlement}
                                  className="justify-between border-white/12 text-slate-100 hover:bg-white/10"
                                  disabled={actionMutation.isPending || !canManageEntitlementLocks}
                                  onClick={() =>
                                    actionMutation.mutate({
                                      action: locked
                                        ? 'unlock_staff_entitlement'
                                        : 'lock_staff_entitlement',
                                      entitlement,
                                    })
                                  }
                                  type="button"
                                  variant="outline"
                                >
                                  <span className="inline-flex items-center gap-2">
                                    {locked ? (
                                      <LockIcon className="size-4" />
                                    ) : (
                                      <LockOpenIcon className="size-4" />
                                    )}
                                    {entitlement}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className={
                                      locked
                                        ? 'rounded-full border border-amber-300/25 bg-amber-300/12 text-amber-100'
                                        : 'rounded-full border border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
                                    }
                                  >
                                    {locked ? 'Locked' : 'Active'}
                                  </Badge>
                                </Button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/14 p-3 text-sm text-slate-300/70">
                            Assign or restore a staff membership before managing entitlement locks.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button
                          className="justify-start"
                          disabled={actionMutation.isPending || !selectedUser}
                          onClick={() =>
                            actionMutation.mutate({
                              action: 'send_staff_invite',
                              roleTemplate: staffRoleTemplate,
                            })
                          }
                          type="button"
                          variant="secondary"
                        >
                          {actionMutation.isPending ? (
                            <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
                          ) : (
                            <MailPlusIcon data-icon="inline-start" />
                          )}
                          {inviteActionLabel}
                        </Button>
                        <Button
                          className="justify-start border-white/12 text-slate-100 hover:bg-white/10"
                          disabled={actionMutation.isPending || !canSuspendStaffAccess}
                          onClick={() => actionMutation.mutate({ action: 'suspend_staff_access' })}
                          type="button"
                          variant="outline"
                        >
                          {actionMutation.isPending ? (
                            <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
                          ) : (
                            <ShieldIcon data-icon="inline-start" />
                          )}
                          Suspend staff access
                        </Button>
                        <Button
                          className="justify-start border-white/12 text-slate-100 hover:bg-white/10"
                          disabled={actionMutation.isPending || !canResyncProvider}
                          onClick={() => actionMutation.mutate({ action: 'resync_provider' })}
                          type="button"
                          variant="outline"
                        >
                          {actionMutation.isPending ? (
                            <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
                          ) : (
                            <RefreshCcwIcon data-icon="inline-start" />
                          )}
                          Resync from Clerk
                        </Button>
                        <Button
                          className="justify-start border-white/12 text-slate-100 hover:bg-white/10"
                          disabled={actionMutation.isPending || !canReactivateStaffAccess}
                          onClick={() => actionMutation.mutate({ action: 'reactivate_staff_access' })}
                          type="button"
                          variant="outline"
                        >
                          {actionMutation.isPending ? (
                            <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
                          ) : (
                            <ShieldCheckIcon data-icon="inline-start" />
                          )}
                          Restore staff access
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button
                          className="justify-start border-white/12 text-slate-100 hover:bg-white/10"
                          disabled={actionMutation.isPending || !canRevokeInvite}
                          onClick={() => actionMutation.mutate({ action: 'revoke_staff_invite' })}
                          type="button"
                          variant="outline"
                        >
                          {actionMutation.isPending ? (
                            <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
                          ) : (
                            <MailPlusIcon data-icon="inline-start" />
                          )}
                          Revoke pending invite
                        </Button>
                      </div>
                      <div className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/35 p-3 text-sm text-slate-300/78">
                        <div className="font-medium text-slate-100">Current sync posture</div>
                        <div>
                          {selectedUser.hasClerkLink
                            ? 'This user already has a Clerk identity, so Grime Time can grant or resync staff membership immediately.'
                            : 'This user still needs a Clerk invitation email before they can complete staff onboarding.'}
                        </div>
                        <div>
                          Entitlement locks:{' '}
                          <span className="text-slate-100">
                            {selectedStaffMembership?.entitlementLocks.length
                              ? `${selectedStaffMembership.entitlementLocks.length} active`
                              : 'No per-user locks'}
                          </span>
                        </div>
                        <div>
                          Invite state: <span className="text-slate-100">{describeInviteState(selectedUser.portalInviteState)}</span>
                        </div>
                        <div>
                          Staff access state:{' '}
                          <span className="text-slate-100">
                            {describeMembershipStatus(selectedStaffMembership?.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                No user is selected because the current filters returned no rows.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function DetailStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheckIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-2 text-sm font-medium">{value}</div>
    </div>
  )
}
