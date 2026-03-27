import type { BadgeProps } from '@/components/ui/badge'

export function companyMemberStatusMeta(state: string): {
  label: string
  variant: BadgeProps['variant']
} {
  switch (state) {
    case 'active':
      return { label: 'Active', variant: 'default' }
    case 'invite_pending':
      return { label: 'Invite pending', variant: 'secondary' }
    case 'claim_pending':
      return { label: 'Claim pending', variant: 'outline' }
    default:
      return { label: 'Not activated', variant: 'outline' }
  }
}
