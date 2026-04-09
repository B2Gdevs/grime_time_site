'use client'

import * as React from 'react'
import {
  BadgeDollarSignIcon,
  Building2Icon,
  CreditCardIcon,
  MailIcon,
  MapPinnedIcon,
  UserRoundIcon,
  UsersIcon,
} from 'lucide-react'

import { SectionCards } from '@/components/section-cards'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import type { OpsCustomerDirectoryRow, OpsCustomersPageData } from '@/lib/ops/loaders/opsAdminData'
import {
  describeAccountStatus,
  describeAccountType,
  describeBillingMode,
  describePortalAccessMode,
} from '@/lib/ops/loaders/opsAdminData'

function filterCustomerRows(args: {
  accountType: string
  portalAccessMode: string
  query: string
  rows: OpsCustomerDirectoryRow[]
  status: string
}) {
  const normalizedQuery = args.query.trim().toLowerCase()

  return args.rows.filter((row) => {
    if (args.status !== 'all' && row.status !== args.status) {
      return false
    }

    if (args.accountType !== 'all' && row.accountType !== args.accountType) {
      return false
    }

    if (args.portalAccessMode !== 'all' && row.portalAccessMode !== args.portalAccessMode) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    const haystack = [
      row.name,
      row.primaryCustomerName,
      row.primaryCustomerEmail,
      row.ownerName,
      row.billingEmail,
      row.status,
      row.accountType,
      ...row.linkedUsers.map((user) => `${user.name} ${user.email}`),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedQuery)
  })
}

export function OpsCustomersPageView({ data }: { data: OpsCustomersPageData }) {
  const [query, setQuery] = React.useState('')
  const [status, setStatus] = React.useState('all')
  const [accountType, setAccountType] = React.useState('all')
  const [portalAccessMode, setPortalAccessMode] = React.useState('all')
  const deferredQuery = React.useDeferredValue(query)
  const filteredRows = filterCustomerRows({
    accountType,
    portalAccessMode,
    query: deferredQuery,
    rows: data.rows,
    status,
  })
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(
    filteredRows[0]?.id ?? data.rows[0]?.id ?? null,
  )
  const selectedAccount =
    filteredRows.find((row) => row.id === selectedAccountId) ?? filteredRows[0] ?? null

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedAccountId(null)
      return
    }

    if (!selectedAccountId || !filteredRows.some((row) => row.id === selectedAccountId)) {
      setSelectedAccountId(filteredRows[0]?.id ?? null)
    }
  }, [filteredRows, selectedAccountId])

  return (
    <div className="@container/main flex flex-col gap-6 py-4 md:py-6">
      <section className="px-4 lg:px-6">
        <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-amber-50 via-white to-emerald-50 shadow-[0_30px_110px_-70px_rgba(120,113,108,0.85)]">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.9fr)] lg:p-7">
            <div className="space-y-3">
              <Badge variant="outline" className="w-fit rounded-full border-amber-300/80 bg-white/80">
                Customer operations
              </Badge>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                  Customers are account-first, with billing and access layered on top.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-slate-700 md:text-base">
                  This view treats accounts as the durable customer record, then shows which
                  people, billing channels, and portal links are attached. That keeps the surface
                  stable even if billing or identity providers change underneath it.
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <Building2Icon className="size-4 text-emerald-700" />
                Fast review cues
              </div>
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                <li>Which accounts are active versus still in prospect status.</li>
                <li>Which ones are commercial or multi-site.</li>
                <li>Where portal access exists without over-trusting Stripe or Clerk.</li>
                <li>Who the primary customer and internal owner are today.</li>
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
                <CardTitle>Customers directory</CardTitle>
                <CardDescription>
                  Account-first filtering across status, type, and portal readiness.
                </CardDescription>
              </div>
              <Badge variant="outline" className="rounded-full border-border/70 bg-background/80">
                {filteredRows.length} visible
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_11rem_11rem_12rem]">
              <div className="space-y-2">
                <label htmlFor="ops-customers-search" className="text-xs font-medium text-muted-foreground">
                  Search customers
                </label>
                <Input
                  id="ops-customers-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search accounts, billing email, owner, or linked users"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="ops-customers-status" className="text-xs font-medium text-muted-foreground">
                  Status
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="ops-customers-status" className="w-full bg-background">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="ops-customers-type" className="text-xs font-medium text-muted-foreground">
                  Account type
                </label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger id="ops-customers-type" className="w-full bg-background">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="hoa_multifamily">HOA / multifamily</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="ops-customers-portal" className="text-xs font-medium text-muted-foreground">
                  Portal access
                </label>
                <Select value={portalAccessMode} onValueChange={setPortalAccessMode}>
                  <SelectTrigger id="ops-customers-portal" className="w-full bg-background">
                    <SelectValue placeholder="All access modes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All access modes</SelectItem>
                    <SelectItem value="none">No Stripe portal</SelectItem>
                    <SelectItem value="stripe_only">Stripe billing only</SelectItem>
                    <SelectItem value="app_and_stripe">App and Stripe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Primary customer</TableHead>
                  <TableHead className="hidden xl:table-cell">Portal</TableHead>
                  <TableHead className="text-right">Billing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length ? (
                  filteredRows.map((row) => {
                    const selected = row.id === selectedAccount?.id

                    return (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        data-state={selected ? 'selected' : undefined}
                        onClick={() => setSelectedAccountId(row.id)}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{row.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {describeAccountStatus(row.status)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="rounded-full">
                            {describeAccountType(row.accountType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="space-y-1">
                            <div className="text-sm">{row.primaryCustomerName || 'No primary user'}</div>
                            <div className="text-xs text-muted-foreground">
                              {row.primaryCustomerEmail || 'No primary email'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <Badge variant="secondary" className="rounded-full">
                            {describePortalAccessMode(row.portalAccessMode)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant={row.stripeCustomerLinked ? 'default' : 'outline'}
                              className="rounded-full"
                            >
                              {row.stripeCustomerLinked ? 'Stripe linked' : 'No Stripe id'}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {row.billingEmail || 'No billing inbox'}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                      No customers match the current search and filter selection.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle>{selectedAccount ? selectedAccount.name : 'Customer detail'}</CardTitle>
            <CardDescription>
              {selectedAccount
                ? 'Account, billing, and access cues for the selected customer.'
                : 'Pick an account from the table to inspect its operating shape.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5 p-5">
            {selectedAccount ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailStat
                    icon={Building2Icon}
                    label="Type"
                    value={describeAccountType(selectedAccount.accountType)}
                  />
                  <DetailStat
                    icon={MapPinnedIcon}
                    label="Status"
                    value={describeAccountStatus(selectedAccount.status)}
                  />
                  <DetailStat
                    icon={UserRoundIcon}
                    label="Primary customer"
                    value={selectedAccount.primaryCustomerName || 'Not assigned'}
                  />
                  <DetailStat
                    icon={BadgeDollarSignIcon}
                    label="Billing mode"
                    value={describeBillingMode(selectedAccount.billingMode)}
                  />
                </div>

                <div className="grid gap-2 rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CreditCardIcon className="size-4 text-muted-foreground" />
                    Billing and portal posture
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full">
                      {describePortalAccessMode(selectedAccount.portalAccessMode)}
                    </Badge>
                    <Badge
                      variant={selectedAccount.stripeCustomerLinked ? 'default' : 'outline'}
                      className="rounded-full"
                    >
                      {selectedAccount.stripeCustomerLinked ? 'Stripe linked' : 'Stripe pending'}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      {selectedAccount.linkedUsers.length} linked user
                      {selectedAccount.linkedUsers.length === 1 ? '' : 's'}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-2 rounded-2xl border border-border/70 bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MailIcon className="size-4 text-muted-foreground" />
                    Account contacts
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Billing inbox:</span>{' '}
                      <span className="text-muted-foreground">
                        {selectedAccount.billingEmail || 'No billing email'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Internal owner:</span>{' '}
                      <span className="text-muted-foreground">
                        {selectedAccount.ownerName || 'No owner assigned'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Primary customer:</span>{' '}
                      <span className="text-muted-foreground">
                        {selectedAccount.primaryCustomerEmail || 'No primary customer email'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <UsersIcon className="size-4 text-muted-foreground" />
                    Linked users
                  </div>
                  {selectedAccount.linkedUsers.length ? (
                    <div className="grid gap-2">
                      {selectedAccount.linkedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="rounded-2xl border border-border/70 bg-background p-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium">{user.name}</div>
                            <Badge
                              variant={user.hasPortalAccess ? 'default' : 'outline'}
                              className="rounded-full"
                            >
                              {user.hasPortalAccess ? 'Portal ready' : 'Needs access'}
                            </Badge>
                            <Badge
                              variant={user.hasClerkLink ? 'secondary' : 'outline'}
                              className="rounded-full"
                            >
                              {user.hasClerkLink ? 'Clerk linked' : 'App-only'}
                            </Badge>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No linked users are attached to this account yet.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                No account is selected because the current filters returned no rows.
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
  icon: typeof Building2Icon
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
