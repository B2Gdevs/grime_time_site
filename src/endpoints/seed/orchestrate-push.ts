/**
 * Orchestrates scope-based seed **push** (`runSeedPush`). Drift checks read expectations from
 * `expectations.ts`; export `SEED_MEDIA`, `SEED_CATEGORIES`, `SEED_POST_SLUGS` stay in sync with that file.
 */
import type { File, Payload, PayloadRequest } from 'payload'

import { portalPreviewTestUserEmail } from '@/lib/auth/previewIdentity'
import { DEFAULT_STAFF_EMAILS } from '@/lib/brand/emailDefaults'
import {
  displayNameForSeedEmail,
  parseQuotesInternalEmailAllowlist,
  resolveSeedStaffEmails,
} from '@/utilities/quotesAccess'
import { SCHEDULE_REQUEST_FORM_TITLE } from '@/lib/forms/scheduleRequest'
import { defaultInstantQuoteCatalog } from '@/lib/quotes/instantQuoteCatalog'
import {
  assetLadder as defaultAssetLadder,
  businessScorecard,
  growthMilestones as defaultGrowthMilestones,
  liabilityChecklist,
} from '@/lib/ops/businessOperatingSystem'
import type { Media, Page, User } from '@/payload-types'
import { about as aboutPageData } from './about-page'
import { buildContactFormData, SEED_CONTACT_FORM_TITLE } from './contact-form'
import { buildInstantQuoteFormData, SEED_INSTANT_QUOTE_FORM_TITLE } from './instant-quote-form'
import {
  contactSlaPage,
  privacyPolicyPage,
  refundPolicyPage,
  termsAndConditionsPage,
} from './public-support-pages'
import { buildScheduleRequestFormData } from './schedule-request-form'
import { contact as contactPageData } from './contact-page'
import { defaultCrmSequences } from './crm-sequences'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { imageSeedDriveway } from './image-seed-driveway'
import { imageSeedHouse } from './image-seed-house'
import { imageSeedProperty } from './image-seed-property'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'
import { type SeedScope, expandScopes } from './scopes'
import {
  findDoc,
  upsertBySlug,
  upsertCategoryBySlug,
  upsertFormByTitle,
  upsertGlobalBySlug,
  upsertMediaByFilename,
  type SeedUpsertAction,
} from './upsert'
import { seedDataMatchesExisting } from './diff'

/**
 * Push-time media list — **must stay aligned** with `EXPECTED_SEED_MEDIA_FILENAMES` in `expectations.ts`
 * (verified by `tests/int/seed/expectations-alignment.int.spec.ts`).
 */
export const SEED_MEDIA = [
  {
    filename: 'image-post1.webp',
    url: 'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post1.webp',
    data: image1,
  },
  {
    filename: 'image-post2.webp',
    url: 'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post2.webp',
    data: image2,
  },
  {
    filename: 'image-post3.webp',
    url: 'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post3.webp',
    data: image2,
  },
  {
    filename: 'seed-grime-house.jpg',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
    data: imageSeedHouse,
  },
  {
    filename: 'seed-grime-driveway.jpg',
    url: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=1920&q=80',
    data: imageSeedDriveway,
  },
  {
    filename: 'seed-grime-property.jpg',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80',
    data: imageSeedProperty,
  },
] as const

/** Category rows upserted in `pushTaxonomy` — slugs must match `EXPECTED_CATEGORY_SLUGS` in `expectations.ts`. */
export const SEED_CATEGORIES = [
  { title: 'Technology', slug: 'technology' },
  { title: 'News', slug: 'news' },
  { title: 'Finance', slug: 'finance' },
  { title: 'Design', slug: 'design' },
  { title: 'Software', slug: 'software' },
  { title: 'Engineering', slug: 'engineering' },
] as const

/** Post slugs passed to `upsertBySlug` in `pushPosts` — must match `EXPECTED_POST_SLUGS` in `expectations.ts`. */
export const SEED_POST_SLUGS = [
  'digital-horizons',
  'global-gaze',
  'dollar-and-sense-the-financial-forecast',
] as const

const LEGACY_ASSET_DEFAULT_LABELS = [
  'Low-cost speed upgrades',
  'Flatwork production',
  'Water independence',
  'Commercial throughput',
  'Premium service mix',
] as const

const CURRENT_DEFAULT_ASSET_LABELS = new Set<string>(defaultAssetLadder.map((item) => item.category))

type MediaDoc = Media

/** Mutable bag filled as scopes run (order enforced by expandScopes). */
type PushCtx = {
  payload: Payload
  req: PayloadRequest
  postAuthor?: User
  image1Doc?: MediaDoc
  image2Doc?: MediaDoc
  image3Doc?: MediaDoc
  imageHouseDoc?: MediaDoc
  imageDrivewayDoc?: MediaDoc
  imagePropertyDoc?: MediaDoc
  contactPage?: Page
  aboutPage?: Page
  privacyPage?: Page
  termsPage?: Page
  refundPage?: Page
  contactSla?: Page
}

type ActionCounts = Record<SeedUpsertAction, number>

function createActionCounts(): ActionCounts {
  return { created: 0, updated: 0, skipped: 0 }
}

function recordAction(counts: ActionCounts, action: SeedUpsertAction) {
  counts[action] += 1
}

function formatActionCounts(counts: ActionCounts) {
  return `created=${counts.created}, updated=${counts.updated}, skipped=${counts.skipped}`
}

async function upsertCollectionDoc(
  payload: Payload,
  req: PayloadRequest,
  args: {
    collection:
      | 'crm-sequences'
      | 'growth-milestones'
      | 'ops-asset-ladder-items'
      | 'ops-liability-items'
      | 'ops-scorecard-rows'
    data: Record<string, unknown>
    keyField: string
    keyValue: string
  },
) {
  const existingDoc = await payload
    .find({
      collection: args.collection,
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: {
        [args.keyField]: {
          equals: args.keyValue,
        },
      },
    })
    .then((result) => result.docs[0] as unknown as Record<string, unknown> | undefined)

  if (existingDoc?.id != null) {
    if (seedDataMatchesExisting(existingDoc, args.data)) {
      return {
        id: existingDoc.id as string | number,
        action: 'skipped' as const,
      }
    }

    const doc = await (payload as any).update({
      collection: args.collection,
      id: existingDoc.id as string | number,
      data: args.data,
      req,
    })
    return {
      id: doc.id as string | number,
      action: 'updated' as const,
    }
  }

  const doc = await (payload as any).create({
    collection: args.collection,
    data: args.data,
    req,
  })
  return {
    id: doc.id as string | number,
    action: 'created' as const,
  }
}

async function fetchFileByURL(url: string, suggestedFilename?: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()
  const headerType = res.headers.get('content-type')?.split(';')[0]?.trim()
  const mimetype =
    headerType && headerType.startsWith('image/')
      ? headerType
      : /\.jpe?g(\?|$)/i.test(url)
        ? 'image/jpeg'
        : /\.webp(\?|$)/i.test(url)
          ? 'image/webp'
          : 'image/jpeg'

  const name =
    suggestedFilename ||
    url.split('/').pop()?.split('?')[0] ||
    `file-${Date.now()}.jpg`

  return {
    name,
    data: Buffer.from(data),
    mimetype,
    size: data.byteLength,
  }
}

async function pushFoundation(ctx: PushCtx): Promise<void> {
  const { payload, req } = ctx
  const staffEmails = resolveSeedStaffEmails()
  const counts = createActionCounts()
  const fromQuotesEnv = parseQuotesInternalEmailAllowlist().length > 0
  payload.logger.info(
    fromQuotesEnv
      ? `— Staff users from QUOTES_INTERNAL_EMAILS (${staffEmails.length}); new users get password: changethis`
      : `— Staff users (defaults; set QUOTES_INTERNAL_EMAILS to match prod); new users get password: changethis`,
  )

  const defaultTeamNames: Record<string, string> = {
    [DEFAULT_STAFF_EMAILS[0]]: 'BG',
    [DEFAULT_STAFF_EMAILS[1]]: 'PB',
    [DEFAULT_STAFF_EMAILS[2]]: 'DE',
  }

  for (const email of ['demo-author@example.com', 'demo-author@payloadcms.com'] as const) {
    try {
      await payload.delete({ collection: 'users', depth: 0, where: { email: { equals: email } }, req })
    } catch {
      /* ignore if absent */
    }
  }

  const teamUsers: User[] = []
  for (const email of staffEmails) {
    const name = defaultTeamNames[email] ?? displayNameForSeedEmail(email)
    const existingId = await payload
      .find({
        collection: 'users',
        where: { email: { equals: email } },
        limit: 1,
        depth: 0,
        req,
      })
      .then((r) => r.docs[0]?.id)

    if (existingId != null) {
      const existingUser = await payload.findByID({
        collection: 'users',
        id: existingId,
        depth: 0,
        req,
      })

      if (seedDataMatchesExisting(existingUser, { name, roles: ['admin'] })) {
        recordAction(counts, 'skipped')
        teamUsers.push(existingUser as User)
      } else {
        const updatedUser = (await payload.update({
          collection: 'users',
          id: existingId,
          data: { name, roles: ['admin'] },
          req,
        })) as User
        recordAction(counts, 'updated')
        teamUsers.push(updatedUser)
      }
    } else {
      const createdUser = (await payload.create({
        collection: 'users',
        data: { name, email, password: 'changethis', roles: ['admin'] },
        req,
      })) as User
      recordAction(counts, 'created')
      teamUsers.push(createdUser)
    }
  }

  const postAuthor = teamUsers[0]
  if (!postAuthor) throw new Error('Seed: expected Grime Time team users')
  ctx.postAuthor = postAuthor

  const previewEmail = portalPreviewTestUserEmail()
  try {
    const existingPreview = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      req,
      where: { email: { equals: previewEmail } },
    })
    const previewId = existingPreview.docs[0]?.id
    if (previewId != null) {
      const existingPreviewUser = await payload.findByID({
        collection: 'users',
        id: previewId,
        depth: 0,
        req,
      })

      if (seedDataMatchesExisting(existingPreviewUser, { name: 'Test User', roles: ['customer'] })) {
        recordAction(counts, 'skipped')
      } else {
        await payload.update({
          collection: 'users',
          id: previewId,
          data: { name: 'Test User', roles: ['customer'] },
          req,
        })
        recordAction(counts, 'updated')
      }
    } else {
      await payload.create({
        collection: 'users',
        data: {
          email: previewEmail,
          name: 'Test User',
          password: 'changethis',
          roles: ['customer'],
        },
        req,
      })
      recordAction(counts, 'created')
    }
    payload.logger.info(`— Preview customer user: ${previewEmail}`)
  } catch (err) {
    payload.logger.warn({ err, msg: `Seed: could not upsert preview user ${previewEmail}` })
  }

  payload.logger.info(`— Foundation summary: ${formatActionCounts(counts)}`)
}

async function pushMedia(ctx: PushCtx): Promise<void> {
  const { payload, req } = ctx
  payload.logger.info(`— Upserting media...`)
  const counts = createActionCounts()
  const mediaDocs: Awaited<ReturnType<typeof upsertMediaByFilename>>[] = []

  for (const media of SEED_MEDIA) {
    const existing = await findDoc(payload, 'media', { filename: { equals: media.filename } }, req)
    const shouldFetchFile = !(existing && seedDataMatchesExisting(existing, media.data))

    const result = await upsertMediaByFilename(payload, req, {
      filename: media.filename,
      data: { ...media.data },
      ...(shouldFetchFile
        ? {
            file: await fetchFileByURL(media.url, media.filename),
          }
        : {}),
    })

    recordAction(counts, result.action)
    mediaDocs.push(result)
  }

  const [image1Doc, image2Doc, image3Doc, imageHouseDoc, imageDrivewayDoc, imagePropertyDoc] =
    await Promise.all(mediaDocs.map((m) => payload.findByID({ collection: 'media', id: m.id, depth: 0, req })))

  ctx.image1Doc = image1Doc as MediaDoc
  ctx.image2Doc = image2Doc as MediaDoc
  ctx.image3Doc = image3Doc as MediaDoc
  ctx.imageHouseDoc = imageHouseDoc as MediaDoc
  ctx.imageDrivewayDoc = imageDrivewayDoc as MediaDoc
  ctx.imagePropertyDoc = imagePropertyDoc as MediaDoc
  payload.logger.info(`— Media summary: ${formatActionCounts(counts)}`)
}

async function pushTaxonomy(ctx: PushCtx): Promise<void> {
  const { payload, req } = ctx
  const counts = createActionCounts()
  for (const cat of SEED_CATEGORIES) {
    const result = await upsertCategoryBySlug(payload, req, cat)
    recordAction(counts, result.action)
  }
  payload.logger.info(`— Taxonomy summary: ${formatActionCounts(counts)}`)
}

async function pushPosts(ctx: PushCtx): Promise<void> {
  const { payload, req, postAuthor, image1Doc, image2Doc, image3Doc } = ctx
  if (!postAuthor || !image1Doc || !image2Doc || !image3Doc) {
    throw new Error('Seed posts scope requires foundation + media')
  }

  payload.logger.info(`— Upserting posts...`)
  const counts = createActionCounts()
  const toRelatedPostId = (value: unknown): number => {
    if (typeof value === 'number') {
      return value
    }

    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }

    throw new Error(`Seed posts scope expected numeric post id, received: ${String(value)}`)
  }

  const postSeed = (slug: string, data: Record<string, unknown>) =>
    upsertBySlug(payload, 'posts', slug, data, req)

  const post1Result = await postSeed(
    'digital-horizons',
    {
      ...post1({ heroImage: image1Doc, blockImage: image2Doc, author: postAuthor }),
      authors: [postAuthor.id],
    },
  )
  recordAction(counts, post1Result.action)
  const post1Doc = await payload.findByID({ collection: 'posts', id: post1Result.id, depth: 0, req })

  const post2Result = await postSeed(
    SEED_POST_SLUGS[1],
    {
      ...post2({ heroImage: image2Doc, blockImage: image3Doc, author: postAuthor }),
      authors: [postAuthor.id],
    },
  )
  recordAction(counts, post2Result.action)
  const post2Doc = await payload.findByID({ collection: 'posts', id: post2Result.id, depth: 0, req })

  const post3Result = await postSeed(
    SEED_POST_SLUGS[2],
    {
      ...post3({ heroImage: image3Doc, blockImage: image1Doc, author: postAuthor }),
      authors: [postAuthor.id],
    },
  )
  recordAction(counts, post3Result.action)
  const post3Doc = await payload.findByID({ collection: 'posts', id: post3Result.id, depth: 0, req })

  const relatedUpdates: Array<{ post: typeof post1Doc; relatedPosts: number[] }> = [
    { post: post1Doc, relatedPosts: [toRelatedPostId(post2Doc.id), toRelatedPostId(post3Doc.id)] },
    { post: post2Doc, relatedPosts: [toRelatedPostId(post1Doc.id), toRelatedPostId(post3Doc.id)] },
    { post: post3Doc, relatedPosts: [toRelatedPostId(post1Doc.id), toRelatedPostId(post2Doc.id)] },
  ]

  for (const update of relatedUpdates) {
    if (seedDataMatchesExisting(update.post, { relatedPosts: update.relatedPosts })) {
      recordAction(counts, 'skipped')
      continue
    }

    await payload.update({
      id: update.post.id,
      collection: 'posts',
      context: { disableRevalidate: true },
      data: { relatedPosts: update.relatedPosts },
      req,
    })
    recordAction(counts, 'updated')
  }

  payload.logger.info(`— Posts summary: ${formatActionCounts(counts)}`)
}

async function pushForms(ctx: PushCtx): Promise<void> {
  const { payload, req } = ctx
  payload.logger.info(`— Upserting contact form...`)
  const counts = createActionCounts()

  recordAction(
    counts,
    (
      await upsertFormByTitle(
        payload,
        req,
        SEED_CONTACT_FORM_TITLE,
        buildContactFormData() as Record<string, unknown>,
      )
    ).action,
  )

  recordAction(
    counts,
    (
      await upsertFormByTitle(
        payload,
        req,
        SEED_INSTANT_QUOTE_FORM_TITLE,
        buildInstantQuoteFormData() as Record<string, unknown>,
      )
    ).action,
  )

  recordAction(
    counts,
    (
      await upsertFormByTitle(
        payload,
        req,
        SCHEDULE_REQUEST_FORM_TITLE,
        buildScheduleRequestFormData() as Record<string, unknown>,
      )
    ).action,
  )

  payload.logger.info(`— Forms summary: ${formatActionCounts(counts)}`)
}

async function pushPages(ctx: PushCtx): Promise<void> {
  const { payload, req, imageHouseDoc, imageDrivewayDoc, imagePropertyDoc } = ctx
  if (!imageHouseDoc || !imageDrivewayDoc || !imagePropertyDoc) {
    throw new Error('Seed pages scope requires media')
  }

  payload.logger.info(`— Upserting pages...`)
  const counts = createActionCounts()

  recordAction(
    counts,
    (
      await upsertBySlug(
        payload,
        'pages',
        'home',
        home({
          heroImage: imageDrivewayDoc,
          metaImage: imageHouseDoc,
          galleryTop: imageHouseDoc,
          galleryMid: imageDrivewayDoc,
          galleryBottom: imagePropertyDoc,
        }) as Record<string, unknown>,
        req,
      )
    ).action,
  )

  const contactResult = await upsertBySlug(
    payload,
    'pages',
    'contact',
    contactPageData({ heroImage: imagePropertyDoc }) as Record<string, unknown>,
    req,
  )
  recordAction(counts, contactResult.action)
  ctx.contactPage = (await payload.findByID({
    collection: 'pages',
    id: contactResult.id,
    depth: 0,
    req,
  })) as Page

  const aboutResult = await upsertBySlug(
    payload,
    'pages',
    'about',
    aboutPageData({ heroImage: imageHouseDoc, supportImage: imagePropertyDoc }) as Record<string, unknown>,
    req,
  )
  recordAction(counts, aboutResult.action)
  ctx.aboutPage = (await payload.findByID({ collection: 'pages', id: aboutResult.id, depth: 0, req })) as Page

  const privacyResult = await upsertBySlug(
    payload,
    'pages',
    'privacy-policy',
    privacyPolicyPage() as Record<string, unknown>,
    req,
  )
  recordAction(counts, privacyResult.action)
  ctx.privacyPage = (await payload.findByID({ collection: 'pages', id: privacyResult.id, depth: 0, req })) as Page

  const termsResult = await upsertBySlug(
    payload,
    'pages',
    'terms-and-conditions',
    termsAndConditionsPage() as Record<string, unknown>,
    req,
  )
  recordAction(counts, termsResult.action)
  ctx.termsPage = (await payload.findByID({ collection: 'pages', id: termsResult.id, depth: 0, req })) as Page

  const refundResult = await upsertBySlug(
    payload,
    'pages',
    'refund-policy',
    refundPolicyPage() as Record<string, unknown>,
    req,
  )
  recordAction(counts, refundResult.action)
  ctx.refundPage = (await payload.findByID({ collection: 'pages', id: refundResult.id, depth: 0, req })) as Page

  const contactSlaResult = await upsertBySlug(
    payload,
    'pages',
    'contact-sla',
    contactSlaPage() as Record<string, unknown>,
    req,
  )
  recordAction(counts, contactSlaResult.action)
  ctx.contactSla = (await payload.findByID({
    collection: 'pages',
    id: contactSlaResult.id,
    depth: 0,
    req,
  })) as Page

  payload.logger.info(`— Pages summary: ${formatActionCounts(counts)}`)
}

async function pushGlobals(ctx: PushCtx): Promise<void> {
  const { payload, req, aboutPage, contactPage, privacyPage, termsPage, refundPage, contactSla } = ctx
  if (!aboutPage || !contactPage || !privacyPage || !termsPage || !refundPage || !contactSla) {
    throw new Error('Seed globals scope requires pages (and their dependencies)')
  }

  payload.logger.info(`— Updating globals...`)
  const results = await Promise.all([
    upsertGlobalBySlug(payload, req, 'header', {
      navItems: [
        { link: { type: 'custom', label: 'Home', url: '/' } },
        {
          link: {
            type: 'reference',
            label: 'About',
            reference: { relationTo: 'pages', value: aboutPage.id },
          },
        },
        { link: { type: 'custom', label: 'Services', url: '/#services' } },
        { link: { type: 'custom', label: 'Get quote', url: '/#instant-quote' } },
        {
          link: {
            type: 'reference',
            label: 'Contact',
            reference: { relationTo: 'pages', value: contactPage.id },
          },
        },
        { link: { type: 'custom', label: 'Book online', url: '/#instant-quote' } },
      ],
    }),
    upsertGlobalBySlug(payload, req, 'footer', {
      navItems: [
        {
          link: {
            type: 'reference',
            label: 'About',
            reference: { relationTo: 'pages', value: aboutPage.id },
          },
        },
        {
          link: {
            type: 'reference',
            label: 'Contact',
            reference: { relationTo: 'pages', value: contactPage.id },
          },
        },
        {
          link: {
            type: 'reference',
            label: 'Privacy',
            reference: { relationTo: 'pages', value: privacyPage.id },
          },
        },
        {
          link: {
            type: 'reference',
            label: 'Terms',
            reference: { relationTo: 'pages', value: termsPage.id },
          },
        },
        {
          link: {
            type: 'reference',
            label: 'Refund policy',
            reference: { relationTo: 'pages', value: refundPage.id },
          },
        },
        {
          link: {
            type: 'reference',
            label: 'Contact SLA',
            reference: { relationTo: 'pages', value: contactSla.id },
          },
        },
      ],
    }),
    upsertGlobalBySlug(payload, req, 'pricing', {
      sectionTitle: 'Quote estimator',
      sectionIntro:
        'Starting points for typical homes — final price depends on size, soil level, and access. Request a quote for an exact number.',
      plans: [],
    }),
    upsertGlobalBySlug(payload, req, 'quoteSettings', {
      services: defaultInstantQuoteCatalog.services.map((service) => ({
        serviceKey: service.key,
        label: service.label,
        description: service.description,
        recommendedFor: service.recommendedFor,
        minimum: service.minimum,
        sqftLowRate: service.sqftLowRate,
        sqftHighRate: service.sqftHighRate,
        enabledOnSite: service.enabledOnSite,
        quoteEnabled: service.quoteEnabled,
        frequencyEligible: service.frequencyEligible,
        sortOrder: service.sortOrder,
      })),
      conditionMultipliers: {
        light: defaultInstantQuoteCatalog.conditionMultipliers.light,
        standard: defaultInstantQuoteCatalog.conditionMultipliers.standard,
        heavy: defaultInstantQuoteCatalog.conditionMultipliers.heavy,
      },
      storyMultipliers: {
        oneStory: defaultInstantQuoteCatalog.storyMultipliers['1'],
        twoStories: defaultInstantQuoteCatalog.storyMultipliers['2'],
        threePlusStories: defaultInstantQuoteCatalog.storyMultipliers['3+'],
      },
      frequencyMultipliers: {
        oneTime: defaultInstantQuoteCatalog.frequencyMultipliers.one_time,
        biannual: defaultInstantQuoteCatalog.frequencyMultipliers.biannual,
        quarterly: defaultInstantQuoteCatalog.frequencyMultipliers.quarterly,
      },
    }),
    upsertGlobalBySlug(payload, req, 'servicePlanSettings', {
      billingInstallmentsPerYear: 12,
      customerSummary:
        'Recurring plans default to two visits per year at a 20% discount from normal one-off pricing, billed in equal installments across the year.',
      defaultCadenceMonths: 6,
      discountPercentOffSingleJob: 20,
      minimumVisitsPerYear: 2,
    }),
  ])

  const counts = createActionCounts()
  for (const result of results) {
    recordAction(counts, result.action)
  }

  payload.logger.info(`— Globals summary: ${formatActionCounts(counts)}`)
}

async function pushOps(ctx: PushCtx): Promise<void> {
  const { payload, req } = ctx
  payload.logger.info(`— Upserting ops data...`)
  const counts = createActionCounts()
  let removedLegacy = 0

  for (const [index, milestone] of defaultGrowthMilestones.entries()) {
    const result = await upsertCollectionDoc(payload, req, {
      collection: 'growth-milestones',
      data: {
        sortOrder: index,
        title: milestone.milestone,
        trigger: milestone.trigger,
        winCondition: milestone.winCondition,
      },
      keyField: 'title',
      keyValue: milestone.milestone,
    })
    recordAction(counts, result.action)
  }

  for (const legacyLabel of LEGACY_ASSET_DEFAULT_LABELS) {
    if (CURRENT_DEFAULT_ASSET_LABELS.has(legacyLabel)) {
      continue
    }

    try {
      const deleted = await payload.delete({
        collection: 'ops-asset-ladder-items',
        depth: 0,
        req,
        where: {
          label: {
            equals: legacyLabel,
          },
        },
      })
      if (Array.isArray(deleted?.docs)) {
        removedLegacy += deleted.docs.length
      }
    } catch {
      /* ignore when the legacy seed row is already gone */
    }
  }

  for (const [index, item] of defaultAssetLadder.entries()) {
    const result = await upsertCollectionDoc(payload, req, {
      collection: 'ops-asset-ladder-items',
      data: {
        buyNotes: item.buy,
        label: item.category,
        owned: item.owned ?? false,
        sortOrder: index,
        whyNotes: item.why,
      },
      keyField: 'label',
      keyValue: item.category,
    })
    recordAction(counts, result.action)
  }

  for (const [index, item] of liabilityChecklist.entries()) {
    const result = await upsertCollectionDoc(payload, req, {
      collection: 'ops-liability-items',
      data: {
        label: item,
        notes: 'Track this weekly until accounting automation owns it.',
        sortOrder: index,
      },
      keyField: 'label',
      keyValue: item,
    })
    recordAction(counts, result.action)
  }

  for (const [index, row] of businessScorecard.entries()) {
    const result = await upsertCollectionDoc(payload, req, {
      collection: 'ops-scorecard-rows',
      data: {
        formula: row.formula,
        manualValue:
          row.name === 'Projected revenue'
            ? 13600
            : row.name === 'MRR'
              ? 1800
              : undefined,
        manualValueLabel:
          row.name === 'Projected revenue'
            ? 'Weighted pipeline'
            : row.name === 'MRR'
              ? 'Target'
              : undefined,
        sortOrder: index,
        targetGuidance: row.target,
        title: row.name,
      },
      keyField: 'title',
      keyValue: row.name,
    })
    recordAction(counts, result.action)
  }

  payload.logger.info(
    `— Ops summary: ${formatActionCounts(counts)}${removedLegacy > 0 ? `, removedLegacy=${removedLegacy}` : ''}`,
  )
}

async function pushCrm(ctx: PushCtx): Promise<void> {
  const { payload, req } = ctx
  payload.logger.info(`— Upserting CRM sequences...`)
  const counts = createActionCounts()

  for (const sequence of defaultCrmSequences) {
    const result = await upsertCollectionDoc(payload, req, {
      collection: 'crm-sequences',
      data: {
        audience: sequence.audience,
        key: sequence.key,
        name: sequence.name,
        status: sequence.status,
        steps: sequence.steps.map((step) => ({ ...step })),
        trigger: sequence.trigger,
      },
      keyField: 'key',
      keyValue: sequence.key,
    })
    recordAction(counts, result.action)
  }

  payload.logger.info(`— CRM summary: ${formatActionCounts(counts)}`)
}

async function pushDemo(ctx: PushCtx, skipDemo: boolean): Promise<void> {
  const { payload, req } = ctx
  if (skipDemo) {
    payload.logger.info('Seed: skipping demo fixtures (skipDemo).')
    return
  }
  const { seedDemoData } = await import('./demo-seed')
  await seedDemoData({ payload, req })
}

const SCOPE_HANDLERS: Record<
  SeedScope,
  (ctx: PushCtx, opts: { skipDemo: boolean }) => Promise<void>
> = {
  foundation: async (ctx) => pushFoundation(ctx),
  media: async (ctx) => pushMedia(ctx),
  taxonomy: async (ctx) => pushTaxonomy(ctx),
  posts: async (ctx) => pushPosts(ctx),
  forms: async (ctx) => pushForms(ctx),
  pages: async (ctx) => pushPages(ctx),
  globals: async (ctx) => pushGlobals(ctx),
  ops: async (ctx) => pushOps(ctx),
  crm: async (ctx) => pushCrm(ctx),
  demo: async (ctx, opts) => pushDemo(ctx, opts.skipDemo),
}

export type RunSeedPushOptions = {
  payload: Payload
  req: PayloadRequest
  /** Raw requested scopes (before dependency expansion), e.g. `['media']` or `ALL_SEED_SCOPES`. */
  scopes: SeedScope[]
  /** When true, demo scope is skipped even if present in expanded scopes. */
  skipDemo?: boolean
}

/**
 * Run idempotent seed upserts for the given scopes (with dependency expansion).
 */
export async function runSeedPush(options: RunSeedPushOptions): Promise<void> {
  const { payload, req, skipDemo = false } = options
  let expanded = expandScopes(options.scopes)
  if (skipDemo) {
    expanded = expanded.filter((s) => s !== 'demo')
  }

  payload.logger.info('Seeding database (upsert — idempotent)...')
  payload.logger.info(`— Scopes: ${expanded.join(', ')}`)

  const ctx: PushCtx = { payload, req }

  for (const scope of expanded) {
    payload.logger.info(`— Running scope: ${scope}`)
    await SCOPE_HANDLERS[scope](ctx, { skipDemo })
  }

  payload.logger.info('Seed upsert finished successfully.')
}
