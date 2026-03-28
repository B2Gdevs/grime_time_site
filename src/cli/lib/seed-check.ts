import pc from 'picocolors'

import {
  EXPECTED_CATEGORY_SLUGS,
  EXPECTED_CRM_SEQUENCE_KEYS,
  EXPECTED_DEMO_ACCOUNT_COUNT,
  EXPECTED_DEMO_ACCOUNT_NAMES,
  EXPECTED_DEMO_PERSONA_COUNT,
  EXPECTED_DEMO_PERSONA_EMAILS,
  EXPECTED_FORM_TITLES,
  EXPECTED_FOOTER_NAV_ITEM_MIN,
  EXPECTED_GLOBAL_HEADER_FIRST_NAV_LABEL,
  EXPECTED_GLOBAL_SLUGS,
  EXPECTED_PAGE_SLUGS,
  EXPECTED_PAGE_TITLE_BY_SLUG,
  EXPECTED_POST_SLUGS,
  EXPECTED_POST_TITLE_BY_SLUG,
  EXPECTED_PRICING_SECTION_TITLE,
  EXPECTED_QUOTE_SETTINGS_SERVICE_COUNT,
  EXPECTED_SEED_MEDIA_FILENAMES,
  EXPECTED_SERVICE_PLAN_DEFAULT_CADENCE_MONTHS,
  EXPECTED_ASSET_LADDER_LABELS,
  EXPECTED_GROWTH_MILESTONE_TITLES,
  EXPECTED_LIABILITY_LABELS,
  EXPECTED_SCORECARD_TITLES,
} from '@/endpoints/seed/expectations'
import { portalPreviewTestUserEmail } from '@/lib/auth/previewIdentity'
import { resolveSeedStaffEmails } from '@/utilities/quotesAccess'
import type { SeedScope } from '@/endpoints/seed/scopes'
import { expandScopes, parseSeedDomainArg, SEED_SCOPE_ALL } from '@/endpoints/seed/scopes'

import type { AdminSession } from './payload-admin-session'
import { formatTable } from './format-table'

type Row = { entity: string; status: 'ok' | 'missing' | 'drift'; detail: string }

export type SeedCheckResult = {
  ok: boolean
  missing: number
  drift: number
  rows: Row[]
}

async function checkFoundation({ payload, req }: AdminSession): Promise<Row[]> {
  const rows: Row[] = []
  const staffEmails = resolveSeedStaffEmails()
  let staffOk = 0
  for (const email of staffEmails) {
    const found = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      req,
      where: { email: { equals: email } },
    })
    if (found.docs[0]) staffOk++
  }
  rows.push({
    entity: 'Staff admin users',
    status: staffOk >= Math.min(1, staffEmails.length) ? 'ok' : 'missing',
    detail: `${staffOk}/${staffEmails.length} resolved emails in QUOTES_INTERNAL_EMAILS / defaults`,
  })

  const previewEmail = portalPreviewTestUserEmail()
  const prev = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    req,
    where: { email: { equals: previewEmail } },
  })
  rows.push({
    entity: `Preview user (${previewEmail})`,
    status: prev.docs[0] ? 'ok' : 'missing',
    detail: prev.docs[0] ? 'present' : 'run seed foundation',
  })
  return rows
}

async function checkMedia({ payload, req }: AdminSession): Promise<Row[]> {
  const rows: Row[] = []
  for (const filename of EXPECTED_SEED_MEDIA_FILENAMES) {
    const found = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 1,
      req,
      where: { filename: { equals: filename } },
    })
    rows.push({
      entity: `media:${filename}`,
      status: found.docs[0] ? 'ok' : 'missing',
      detail: found.docs[0] ? `id ${found.docs[0].id}` : 'not found',
    })
  }
  return rows
}

async function checkTaxonomy({ payload, req }: AdminSession): Promise<Row[]> {
  const rows: Row[] = []
  for (const slug of EXPECTED_CATEGORY_SLUGS) {
    const found = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1,
      req,
      where: { slug: { equals: slug } },
    })
    rows.push({
      entity: `category:${slug}`,
      status: found.docs[0] ? 'ok' : 'missing',
      detail: found.docs[0] ? 'present' : 'not found',
    })
  }
  return rows
}

async function checkPosts({ payload, req }: AdminSession): Promise<Row[]> {
  const rows: Row[] = []
  for (const slug of EXPECTED_POST_SLUGS) {
    const found = await payload.find({
      collection: 'posts',
      depth: 0,
      limit: 1,
      req,
      where: { slug: { equals: slug } },
    })
    const doc = found.docs[0] as { title?: string } | undefined
    const expectedTitle = EXPECTED_POST_TITLE_BY_SLUG[slug]
    if (!doc) {
      rows.push({ entity: `post:${slug}`, status: 'missing', detail: 'not found' })
      continue
    }
    if (doc.title !== expectedTitle) {
      rows.push({
        entity: `post:${slug}`,
        status: 'drift',
        detail: `title DB=${JSON.stringify(doc.title)} expected=${JSON.stringify(expectedTitle)}`,
      })
    } else {
      rows.push({ entity: `post:${slug}`, status: 'ok', detail: 'title matches' })
    }
  }
  return rows
}

async function checkForms({ payload, req }: AdminSession): Promise<Row[]> {
  const rows: Row[] = []
  for (const title of EXPECTED_FORM_TITLES) {
    const found = await payload.find({
      collection: 'forms',
      depth: 0,
      limit: 1,
      req,
      where: { title: { equals: title } },
    })
    rows.push({
      entity: `form:${title}`,
      status: found.docs[0] ? 'ok' : 'missing',
      detail: found.docs[0] ? `id ${found.docs[0].id}` : 'not found',
    })
  }
  return rows
}

async function checkPages({ payload, req }: AdminSession): Promise<Row[]> {
  const rows: Row[] = []
  for (const slug of EXPECTED_PAGE_SLUGS) {
    const found = await payload.find({
      collection: 'pages',
      depth: 0,
      limit: 1,
      req,
      where: { slug: { equals: slug } },
    })
    const doc = found.docs[0] as { title?: string } | undefined
    const expectedTitle = EXPECTED_PAGE_TITLE_BY_SLUG[slug as keyof typeof EXPECTED_PAGE_TITLE_BY_SLUG]
    if (!doc) {
      rows.push({ entity: `page:${slug}`, status: 'missing', detail: 'not found' })
      continue
    }
    if (expectedTitle != null && doc.title !== expectedTitle) {
      rows.push({
        entity: `page:${slug}`,
        status: 'drift',
        detail: `title DB=${JSON.stringify(doc.title)} expected=${JSON.stringify(expectedTitle)}`,
      })
    } else {
      rows.push({ entity: `page:${slug}`, status: 'ok', detail: expectedTitle ? 'title matches' : 'present' })
    }
  }
  return rows
}

async function checkGlobals({ payload, req }: AdminSession): Promise<Row[]> {
  const rows: Row[] = []
  for (const slug of EXPECTED_GLOBAL_SLUGS) {
    let g: Record<string, unknown> | null = null
    try {
      const doc = await payload.findGlobal({ slug, depth: 0, req })
      g = doc && typeof doc === 'object' ? (doc as unknown as Record<string, unknown>) : null
    } catch {
      rows.push({ entity: `global:${slug}`, status: 'missing', detail: 'fetch failed' })
      continue
    }
    if (!g) {
      rows.push({ entity: `global:${slug}`, status: 'missing', detail: 'not returned' })
      continue
    }
    rows.push({ entity: `global:${slug}`, status: 'ok', detail: 'present' })

    if (slug === 'header') {
      const nav = g.navItems as { link?: { label?: string } }[] | undefined
      const first = nav?.[0]?.link?.label
      if (first !== EXPECTED_GLOBAL_HEADER_FIRST_NAV_LABEL) {
        rows.push({
          entity: 'global:header/firstNavLabel',
          status: 'drift',
          detail: `DB=${JSON.stringify(first)} expected=${JSON.stringify(EXPECTED_GLOBAL_HEADER_FIRST_NAV_LABEL)}`,
        })
      } else {
        rows.push({ entity: 'global:header/firstNavLabel', status: 'ok', detail: 'matches' })
      }
    }

    if (slug === 'footer') {
      const nav = g.navItems as unknown[] | undefined
      const n = Array.isArray(nav) ? nav.length : 0
      if (n < EXPECTED_FOOTER_NAV_ITEM_MIN) {
        rows.push({
          entity: 'global:footer/navItems.length',
          status: 'drift',
          detail: `${n} items, expected at least ${EXPECTED_FOOTER_NAV_ITEM_MIN}`,
        })
      } else {
        rows.push({
          entity: 'global:footer/navItems.length',
          status: 'ok',
          detail: `${n} items`,
        })
      }
    }

    if (slug === 'pricing') {
      const title = g.sectionTitle as string | undefined
      if (title !== EXPECTED_PRICING_SECTION_TITLE) {
        rows.push({
          entity: 'global:pricing/sectionTitle',
          status: 'drift',
          detail: `DB=${JSON.stringify(title)} expected=${JSON.stringify(EXPECTED_PRICING_SECTION_TITLE)}`,
        })
      } else {
        rows.push({ entity: 'global:pricing/sectionTitle', status: 'ok', detail: 'matches' })
      }
    }

    if (slug === 'quoteSettings') {
      const services = g.services as unknown[] | undefined
      const n = Array.isArray(services) ? services.length : 0
      if (n !== EXPECTED_QUOTE_SETTINGS_SERVICE_COUNT) {
        rows.push({
          entity: 'global:quoteSettings/services.length',
          status: 'drift',
          detail: `${n} services, expected ${EXPECTED_QUOTE_SETTINGS_SERVICE_COUNT}`,
        })
      } else {
        rows.push({
          entity: 'global:quoteSettings/services.length',
          status: 'ok',
          detail: `${n} services`,
        })
      }
    }

    if (slug === 'servicePlanSettings') {
      const cadence = g.defaultCadenceMonths as number | undefined
      if (cadence !== EXPECTED_SERVICE_PLAN_DEFAULT_CADENCE_MONTHS) {
        rows.push({
          entity: 'global:servicePlanSettings/defaultCadenceMonths',
          status: 'drift',
          detail: `DB=${cadence} expected ${EXPECTED_SERVICE_PLAN_DEFAULT_CADENCE_MONTHS}`,
        })
      } else {
        rows.push({
          entity: 'global:servicePlanSettings/defaultCadenceMonths',
          status: 'ok',
          detail: 'matches',
        })
      }
    }
  }
  return rows
}

async function checkOps({ payload, req }: AdminSession): Promise<Row[]> {
  const rows: Row[] = []

  async function byKey(
    collection: 'growth-milestones' | 'ops-asset-ladder-items' | 'ops-liability-items' | 'ops-scorecard-rows',
    field: 'title' | 'label',
    values: readonly string[],
    label: string,
  ) {
    for (const v of values) {
      const found = await payload.find({
        collection,
        depth: 0,
        limit: 1,
        req,
        where: { [field]: { equals: v } },
      })
      rows.push({
        entity: `${label}:${v}`,
        status: found.docs[0] ? 'ok' : 'missing',
        detail: found.docs[0] ? 'present' : 'not found',
      })
    }
  }

  await byKey('growth-milestones', 'title', EXPECTED_GROWTH_MILESTONE_TITLES, 'growth')
  await byKey('ops-asset-ladder-items', 'label', EXPECTED_ASSET_LADDER_LABELS, 'asset')
  await byKey('ops-liability-items', 'label', EXPECTED_LIABILITY_LABELS, 'liability')
  await byKey('ops-scorecard-rows', 'title', EXPECTED_SCORECARD_TITLES, 'scorecard')
  return rows
}

async function checkCrm({ payload, req }: AdminSession): Promise<Row[]> {
  const rows: Row[] = []
  for (const key of EXPECTED_CRM_SEQUENCE_KEYS) {
    const found = await payload.find({
      collection: 'crm-sequences',
      depth: 0,
      limit: 1,
      req,
      where: { key: { equals: key } },
    })
    rows.push({
      entity: `crm-sequence:${key}`,
      status: found.docs[0] ? 'ok' : 'missing',
      detail: found.docs[0] ? 'present' : 'not found',
    })
  }
  return rows
}

async function checkDemo({ payload, req }: AdminSession): Promise<Row[]> {
  const rows: Row[] = []

  const accountsBundle = await payload.find({
    collection: 'accounts',
    depth: 0,
    limit: 100,
    req,
    where: { name: { in: [...EXPECTED_DEMO_ACCOUNT_NAMES] } },
  })
  const accTotal = accountsBundle.totalDocs
  rows.push({
    entity: 'Demo accounts (by seed names)',
    status:
      accTotal === EXPECTED_DEMO_ACCOUNT_COUNT
        ? 'ok'
        : accTotal === 0
          ? 'missing'
          : 'drift',
    detail: `found ${accTotal}, expected ${EXPECTED_DEMO_ACCOUNT_COUNT}`,
  })

  let personaUsersOk = 0
  for (const email of EXPECTED_DEMO_PERSONA_EMAILS) {
    const found = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      req,
      where: { email: { equals: email } },
    })
    if (found.docs[0]) personaUsersOk++
  }
  rows.push({
    entity: 'Demo portal users (persona emails)',
    status:
      personaUsersOk === EXPECTED_DEMO_PERSONA_COUNT
        ? 'ok'
        : personaUsersOk === 0
          ? 'missing'
          : 'drift',
    detail: `${personaUsersOk}/${EXPECTED_DEMO_PERSONA_COUNT} users present`,
  })

  for (const name of EXPECTED_DEMO_ACCOUNT_NAMES) {
    const found = await payload.find({
      collection: 'accounts',
      depth: 0,
      limit: 1,
      req,
      where: { name: { equals: name } },
    })
    rows.push({
      entity: `account:${name}`,
      status: found.docs[0] ? 'ok' : 'missing',
      detail: found.docs[0] ? 'present' : 'not found (seed demo scope)',
    })
  }
  return rows
}

const CHECKERS: Record<SeedScope, (s: AdminSession) => Promise<Row[]>> = {
  foundation: checkFoundation,
  media: checkMedia,
  taxonomy: checkTaxonomy,
  posts: checkPosts,
  forms: checkForms,
  pages: checkPages,
  globals: checkGlobals,
  ops: checkOps,
  crm: checkCrm,
  demo: checkDemo,
}

export async function runSeedCheck(
  session: AdminSession,
  domainArg: string,
  options?: { json?: boolean },
): Promise<SeedCheckResult> {
  const scopes =
    domainArg === SEED_SCOPE_ALL ? expandScopes([...parseSeedDomainArg('all')]) : expandScopes(parseSeedDomainArg(domainArg))

  const allRows: Row[] = []
  for (const scope of scopes) {
    const part = await CHECKERS[scope](session)
    for (const r of part) {
      r.entity = `${scope}/${r.entity}`
    }
    allRows.push(...part)
  }

  const missing = allRows.filter((r) => r.status === 'missing').length
  const drift = allRows.filter((r) => r.status === 'drift').length
  const result: SeedCheckResult = {
    ok: missing === 0 && drift === 0,
    missing,
    drift,
    rows: allRows,
  }

  if (options?.json) {
    console.log(JSON.stringify(result))
    return result
  }

  console.log(
    pc.dim('Comparing database to repository expectations in ') +
      pc.cyan('src/endpoints/seed/expectations.ts') +
      pc.dim('.'),
  )
  console.log(pc.dim(`Scopes: ${scopes.join(', ')}\n`))

  const tableRows = allRows.map((r) => [r.entity, r.status, r.detail])
  console.log(formatTable(['Entity', 'Status', 'Detail'], tableRows))

  console.log('')
  if (missing === 0 && drift === 0) {
    console.log(pc.green('Summary: all checked keys match expectations.'))
  } else {
    console.log(
      pc.yellow(`Summary: ${missing} missing, ${drift} drift — run `) +
        pc.cyan('grimetime seed push <scope>') +
        pc.yellow(' to align.'),
    )
  }

  return result
}
