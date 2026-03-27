import { formatDistanceToNow } from 'date-fns'
import { Building2Icon, ShieldCheckIcon, UsersIcon } from 'lucide-react'

import { CustomerCompanyInviteForm } from '@/components/portal/CustomerCompanyInviteForm'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { companyMemberStatusMeta } from '@/lib/customers/companyAccessMeta'
import type { CompanyAccessSummary } from '@/lib/customers/companyAccess'

type Props = {
  summary: CompanyAccessSummary
}

function relativeLogin(timestamp: null | string): string {
  if (!timestamp) {
    return 'No portal login yet'
  }

  return `Last portal login ${formatDistanceToNow(new Date(timestamp), { addSuffix: true })}`
}

export function CustomerCompanyAccessCard({ summary }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2Icon className="size-5 text-primary" />
          Company access
        </CardTitle>
        <CardDescription>
          Manage who can sign in under {summary.accountName} and review current activation status.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-3 rounded-2xl border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <UsersIcon className="size-4 text-primary" />
            Company members
          </div>
          <div className="grid gap-3">
            {summary.members.map((member) => {
              const status = companyMemberStatusMeta(member.portalInviteState)

              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-2 rounded-xl border bg-muted/30 px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{member.name}</span>
                      {member.isPrimary ? (
                        <Badge className="gap-1" variant="outline">
                          <ShieldCheckIcon className="size-3" />
                          Primary
                        </Badge>
                      ) : null}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">{member.email}</div>
                    <div className="text-xs text-muted-foreground">{relativeLogin(member.lastPortalLoginAt)}</div>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              )
            })}
          </div>
        </div>

        {summary.canInvite ? (
          <CustomerCompanyInviteForm accountName={summary.accountName} />
        ) : (
          <div className="rounded-2xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
            Only the primary company contact can send additional company-user invites.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
