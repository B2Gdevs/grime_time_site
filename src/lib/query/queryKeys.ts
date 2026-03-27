export const queryKeys = {
  billingWorkspace: ['billing-workspace'] as const,
  companyAccess: ['company-access'] as const,
  crmRecord: (kind: string, id: string) => ['crm-record', kind, id] as const,
  crmOwners: ['crm-owners'] as const,
  crmWorkspace: (args: { commercialOnly: boolean; ownerScope: string; searchQuery: string }) =>
    ['crm-workspace', args.searchQuery, args.ownerScope, args.commercialOnly ? 'commercial' : 'all'] as const,
  customerPortalBilling: ['customer-portal-billing'] as const,
} as const
