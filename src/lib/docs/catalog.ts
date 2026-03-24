import { readFile } from 'node:fs/promises'
import path from 'node:path'

export type PortalDocAudience = 'all' | 'admin'

export type PortalDoc = {
  audience: PortalDocAudience
  description: string
  filePath: string
  group: string
  slug: string
  title: string
}

const DOCS: PortalDoc[] = [
  {
    audience: 'all',
    description: 'How the customer account works and what belongs here.',
    filePath: 'src/content/docs/customer-portal-overview.md',
    group: 'Customer help',
    slug: 'customer-portal-overview',
    title: 'Customer portal overview',
  },
  {
    audience: 'all',
    description: 'Checklist customers can review before service day.',
    filePath: 'src/content/docs/preparing-for-service.md',
    group: 'Customer help',
    slug: 'preparing-for-service',
    title: 'Preparing for service',
  },
  {
    audience: 'all',
    description: 'Support expectations for quotes, service changes, and follow-up.',
    filePath: 'src/content/docs/payment-and-support.md',
    group: 'Customer help',
    slug: 'payment-and-support',
    title: 'Billing and support',
  },
  {
    audience: 'admin',
    description: 'KPIs, MRR model, asset ladder, milestones, and daily operating rhythm.',
    filePath: '.planning/workflows/business-scorecard-and-growth.md',
    group: 'Team playbooks',
    slug: 'business-scorecard-and-growth',
    title: 'Business scorecard and growth',
  },
  {
    audience: 'admin',
    description: 'Internal quote workflow, pricing math, and Texas sales-tax review notes.',
    filePath: '.planning/workflows/quote-system-and-texas-compliance.md',
    group: 'Team playbooks',
    slug: 'quote-system-and-texas-compliance',
    title: 'Quote system and Texas compliance',
  },
  {
    audience: 'admin',
    description: 'Operational runbook for handling inbound leads and turning them into customers.',
    filePath: 'src/content/docs/lead-to-customer-runbook.md',
    group: 'Team playbooks',
    slug: 'lead-to-customer-runbook',
    title: 'Lead to customer runbook',
  },
  {
    audience: 'admin',
    description: 'How the public site, Payload forms, and EngageBay fit together.',
    filePath: '.planning/workflows/customer-site-content-and-engagebay.md',
    group: 'Team playbooks',
    slug: 'customer-site-content-and-engagebay',
    title: 'Customer site and EngageBay',
  },
  {
    audience: 'admin',
    description: 'Security boundary for internal docs and where sensitive material should live.',
    filePath: '.planning/workflows/internal-docs-policy.md',
    group: 'Team playbooks',
    slug: 'internal-docs-policy',
    title: 'Internal docs policy',
  },
  {
    audience: 'admin',
    description: 'Launch checklist for the public site, instant quote flow, EngageBay, and Resend.',
    filePath: '.planning/workflows/site-integrations-and-launch-checklist.md',
    group: 'Team playbooks',
    slug: 'site-integrations-and-launch-checklist',
    title: 'Site integrations and launch checklist',
  },
]

export function getPortalDocs(options: { isAdmin: boolean }): PortalDoc[] {
  return DOCS.filter((doc) => options.isAdmin || doc.audience === 'all')
}

export function getPortalDocBySlug(slug: string, options: { isAdmin: boolean }): PortalDoc | null {
  return getPortalDocs(options).find((doc) => doc.slug === slug) ?? null
}

export function groupPortalDocs(docs: PortalDoc[]): Array<{ docs: PortalDoc[]; group: string }> {
  const grouped = new Map<string, PortalDoc[]>()

  for (const doc of docs) {
    const existing = grouped.get(doc.group) ?? []
    existing.push(doc)
    grouped.set(doc.group, existing)
  }

  return Array.from(grouped.entries()).map(([group, groupDocs]) => ({
    docs: groupDocs,
    group,
  }))
}

export async function readPortalDoc(doc: PortalDoc): Promise<string> {
  const absolutePath = path.resolve(process.cwd(), doc.filePath)
  return readFile(absolutePath, 'utf8')
}
