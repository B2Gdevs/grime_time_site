import type { File, Payload, PayloadRequest } from 'payload'

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
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { imageHero1 } from './image-hero-1'
import { imageSeedDriveway } from './image-seed-driveway'
import { imageSeedHouse } from './image-seed-house'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'
import {
  upsertBySlug,
  upsertCategoryBySlug,
  upsertFormByTitle,
  upsertMediaByFilename,
} from './upsert'

const SEED_MEDIA = [
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
    filename: 'image-hero1.webp',
    url: 'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-hero1.webp',
    data: imageHero1,
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
] as const

/** Canonical slugs must match Payload slugField output (lowercase) or upsert find misses and inserts duplicate. */
const SEED_CATEGORIES = [
  { title: 'Technology', slug: 'technology' },
  { title: 'News', slug: 'news' },
  { title: 'Finance', slug: 'finance' },
  { title: 'Design', slug: 'design' },
  { title: 'Software', slug: 'software' },
  { title: 'Engineering', slug: 'engineering' },
] as const

// Revalidation may log errors when the Next app is not running — safe to ignore for CLI seed.

function logSeedFailure(payload: Payload, err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  payload.logger.error({ msg: `Seed failed: ${message}`, err })
  const data =
    err && typeof err === 'object' && 'data' in err
      ? (err as { data?: { errors?: unknown } }).data
      : undefined
  if (data?.errors) {
    const serialized = JSON.stringify(data.errors, null, 2)
    payload.logger.error(
      `Payload validation (check seed modules vs field maxRows/required — e.g. hero links vs src/heros/config.ts):\n${serialized}`,
    )
    console.error('Payload validation detail:\n', serialized)
  }
}

export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  try {
    await runSeed({ payload, req })
  } catch (err) {
    logSeedFailure(payload, err)
    throw err
  }
}

async function runSeed({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  payload.logger.info('Seeding database (upsert — idempotent)...')

  const staffEmails = resolveSeedStaffEmails()
  const fromQuotesEnv = parseQuotesInternalEmailAllowlist().length > 0
  payload.logger.info(
    fromQuotesEnv
      ? `— Staff users from QUOTES_INTERNAL_EMAILS (${staffEmails.length}); new users get password: changethis`
      : `— Staff users (defaults; set QUOTES_INTERNAL_EMAILS to match prod); new users get password: changethis`,
  )

  const defaultTeamNames: Record<string, string> = {
    'bg@grimetime.local': 'BG',
    'pb@grimetime.local': 'PB',
    'de@grimetime.local': 'DE',
  }

  for (const email of ['demo-author@example.com', 'demo-author@payloadcms.com'] as const) {
    try {
      await payload.delete({ collection: 'users', depth: 0, where: { email: { equals: email } }, req })
    } catch {
      /* ignore if absent */
    }
  }

  const teamUsers = []
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
      teamUsers.push(
        await payload.update({
          collection: 'users',
          id: existingId,
          data: { name, roles: ['admin'] },
          req,
        }),
      )
    } else {
      teamUsers.push(
        await payload.create({
          collection: 'users',
          data: { name, email, password: 'changethis', roles: ['admin'] },
          req,
        }),
      )
    }
  }

  const postAuthor = teamUsers[0]
  if (!postAuthor) throw new Error('Seed: expected Grime Time team users')

  payload.logger.info(`— Upserting media...`)

  const buffers = await Promise.all(
    SEED_MEDIA.map((m, i) => fetchFileByURL(m.url, m.filename)),
  )

  // Sequential upserts: `payload.create` sets `req.file` on the shared local `req`, so
  // parallel creates race and can trigger MissingFile / wrong binaries.
  const mediaDocs: Awaited<ReturnType<typeof upsertMediaByFilename>>[] = []
  for (let i = 0; i < SEED_MEDIA.length; i++) {
    const m = SEED_MEDIA[i]
    mediaDocs.push(
      await upsertMediaByFilename(payload, req, {
        filename: m.filename,
        data: { ...m.data },
        file: buffers[i],
      }),
    )
  }

  const [
    image1Doc,
    image2Doc,
    image3Doc,
    imageHomeDoc,
    imageHouseDoc,
    imageDrivewayDoc,
  ] = await Promise.all(
    mediaDocs.map((m) => payload.findByID({ collection: 'media', id: m.id, depth: 0, req })),
  )

  for (const cat of SEED_CATEGORIES) {
    await upsertCategoryBySlug(payload, req, cat)
  }

  payload.logger.info(`— Upserting posts...`)

  const postSeed = (slug: string, data: Record<string, unknown>) =>
    upsertBySlug(payload, 'posts', slug, data, req)

  const post1Doc = await postSeed(
    'digital-horizons',
    {
      ...post1({ heroImage: image1Doc, blockImage: image2Doc, author: postAuthor }),
      authors: [postAuthor.id],
    },
  ).then(({ id }) => payload.findByID({ collection: 'posts', id, depth: 0, req }))

  const post2Doc = await postSeed(
    'global-gaze',
    {
      ...post2({ heroImage: image2Doc, blockImage: image3Doc, author: postAuthor }),
      authors: [postAuthor.id],
    },
  ).then(({ id }) => payload.findByID({ collection: 'posts', id, depth: 0, req }))

  const post3Doc = await postSeed(
    'dollar-and-sense-the-financial-forecast',
    {
      ...post3({ heroImage: image3Doc, blockImage: image1Doc, author: postAuthor }),
      authors: [postAuthor.id],
    },
  ).then(({ id }) => payload.findByID({ collection: 'posts', id, depth: 0, req }))

  await payload.update({
    id: post1Doc.id,
    collection: 'posts',
    data: { relatedPosts: [post2Doc.id, post3Doc.id] },
    req,
  })
  await payload.update({
    id: post2Doc.id,
    collection: 'posts',
    data: { relatedPosts: [post1Doc.id, post3Doc.id] },
    req,
  })
  await payload.update({
    id: post3Doc.id,
    collection: 'posts',
    data: { relatedPosts: [post1Doc.id, post2Doc.id] },
    req,
  })

  payload.logger.info(`— Upserting contact form...`)

  const contactForm = await upsertFormByTitle(
    payload,
    req,
    SEED_CONTACT_FORM_TITLE,
    buildContactFormData() as Record<string, unknown>,
  ).then(({ id }) => payload.findByID({ collection: 'forms', id, depth: 0, req }))

  await upsertFormByTitle(
    payload,
    req,
    SEED_INSTANT_QUOTE_FORM_TITLE,
    buildInstantQuoteFormData() as Record<string, unknown>,
  )

  await upsertFormByTitle(
    payload,
    req,
    SCHEDULE_REQUEST_FORM_TITLE,
    buildScheduleRequestFormData() as Record<string, unknown>,
  )

  payload.logger.info(`— Upserting pages...`)

  await upsertBySlug(
    payload,
    'pages',
    'home',
    home({
      heroImage: imageHomeDoc,
      metaImage: image2Doc,
      galleryTop: imageHouseDoc,
      galleryMid: image1Doc,
      galleryBottom: imageDrivewayDoc,
    }) as Record<string, unknown>,
    req,
  )

  const contactPage = await upsertBySlug(
    payload,
    'pages',
    'contact',
    contactPageData({ contactForm }) as Record<string, unknown>,
    req,
  ).then(({ id }) => payload.findByID({ collection: 'pages', id, depth: 0, req }))

  const aboutPage = await upsertBySlug(
    payload,
    'pages',
    'about',
    aboutPageData() as Record<string, unknown>,
    req,
  ).then(({ id }) => payload.findByID({ collection: 'pages', id, depth: 0, req }))

  const privacyPage = await upsertBySlug(
    payload,
    'pages',
    'privacy-policy',
    privacyPolicyPage() as Record<string, unknown>,
    req,
  ).then(({ id }) => payload.findByID({ collection: 'pages', id, depth: 0, req }))

  const termsPage = await upsertBySlug(
    payload,
    'pages',
    'terms-and-conditions',
    termsAndConditionsPage() as Record<string, unknown>,
    req,
  ).then(({ id }) => payload.findByID({ collection: 'pages', id, depth: 0, req }))

  const refundPage = await upsertBySlug(
    payload,
    'pages',
    'refund-policy',
    refundPolicyPage() as Record<string, unknown>,
    req,
  ).then(({ id }) => payload.findByID({ collection: 'pages', id, depth: 0, req }))

  const contactSla = await upsertBySlug(
    payload,
    'pages',
    'contact-sla',
    contactSlaPage() as Record<string, unknown>,
    req,
  ).then(({ id }) => payload.findByID({ collection: 'pages', id, depth: 0, req }))

  payload.logger.info(`— Updating globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Home',
              url: '/',
            },
          },
          {
            link: {
              type: 'reference',
              label: 'About',
              reference: {
                relationTo: 'pages',
                value: aboutPage.id,
              },
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Services',
              url: '/#services',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Pricing',
              url: '/#pricing',
            },
          },
          {
            link: {
              type: 'reference',
              label: 'Contact',
              reference: {
                relationTo: 'pages',
                value: contactPage.id,
              },
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Book online',
              url: '/schedule',
            },
          },
        ],
      },
      req,
    }),
    payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          {
            link: {
              type: 'reference',
              label: 'About',
              reference: {
                relationTo: 'pages',
                value: aboutPage.id,
              },
            },
          },
          {
            link: {
              type: 'reference',
              label: 'Contact',
              reference: {
                relationTo: 'pages',
                value: contactPage.id,
              },
            },
          },
          {
            link: {
              type: 'reference',
              label: 'Privacy',
              reference: {
                relationTo: 'pages',
                value: privacyPage.id,
              },
            },
          },
          {
            link: {
              type: 'reference',
              label: 'Terms',
              reference: {
                relationTo: 'pages',
                value: termsPage.id,
              },
            },
          },
          {
            link: {
              type: 'reference',
              label: 'Refund policy',
              reference: {
                relationTo: 'pages',
                value: refundPage.id,
              },
            },
          },
          {
            link: {
              type: 'reference',
              label: 'Contact SLA',
              reference: {
                relationTo: 'pages',
                value: contactSla.id,
              },
            },
          },
        ],
      },
      req,
    }),
    payload.updateGlobal({
      slug: 'pricing',
      data: {
        sectionTitle: 'Packages & pricing',
        sectionIntro:
          'Starting points for typical homes — final price depends on size, soil level, and access. Request a quote for an exact number.',
        plans: [
          {
            name: 'Essential wash',
            tagline: 'Great for maintenance',
            price: 'From $149',
            priceNote: 'Typical small home / partial facade',
            highlighted: false,
            features: [
              { text: 'Soft wash siding & trim' },
              { text: 'Mildew & dust removal' },
              { text: 'Walkthrough photo summary' },
            ],
            link: {
              type: 'custom',
              label: 'Get info',
              url: '/contact',
              appearance: 'outline',
            },
          },
          {
            name: 'Full exterior',
            tagline: 'Most popular',
            price: 'From $279',
            priceNote: 'Average single-story home',
            highlighted: true,
            features: [
              { text: 'Everything in Essential' },
              { text: 'Gutters & soffits rinsed' },
              { text: 'Concrete entryway rinse' },
              { text: 'Priority scheduling window' },
            ],
            link: {
              type: 'custom',
              label: 'Book / quote',
              url: '/schedule',
              appearance: 'default',
            },
          },
          {
            name: 'Property refresh',
            tagline: 'Larger or heavily soiled',
            price: 'Custom',
            priceNote: 'Multi-story, stone, heavy organic growth',
            highlighted: false,
            features: [
              { text: 'Site visit or photo estimate' },
              { text: 'Add-ons: roof, deck, fence' },
              { text: 'Commercial & HOA welcome' },
            ],
            link: {
              type: 'custom',
              label: 'Request quote',
              url: '/contact',
              appearance: 'outline',
            },
          },
        ],
      },
      req,
    }),
    payload.updateGlobal({
      slug: 'quoteSettings',
      data: {
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
      },
      req,
    }),
    payload.updateGlobal({
      slug: 'servicePlanSettings',
      data: {
        billingInstallmentsPerYear: 12,
        customerSummary:
          'Recurring plans default to two visits per year at a 20% discount from normal one-off pricing, billed in equal installments across the year.',
        defaultCadenceMonths: 6,
        discountPercentOffSingleJob: 20,
        minimumVisitsPerYear: 2,
      },
      req,
    }),
  ])

  for (const [index, milestone] of defaultGrowthMilestones.entries()) {
    await upsertCollectionDoc(payload, req, {
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
  }

  for (const [index, item] of defaultAssetLadder.entries()) {
    await upsertCollectionDoc(payload, req, {
      collection: 'ops-asset-ladder-items',
      data: {
        buyNotes: item.buy,
        label: item.category,
        owned: false,
        sortOrder: index,
        whyNotes: item.why,
      },
      keyField: 'label',
      keyValue: item.category,
    })
  }

  for (const [index, item] of liabilityChecklist.entries()) {
    await upsertCollectionDoc(payload, req, {
      collection: 'ops-liability-items',
      data: {
        label: item,
        notes: 'Track this weekly until accounting automation owns it.',
        sortOrder: index,
      },
      keyField: 'label',
      keyValue: item,
    })
  }

  for (const [index, row] of businessScorecard.entries()) {
    await upsertCollectionDoc(payload, req, {
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
  }

  payload.logger.info('Seed upsert finished successfully.')
}

async function upsertCollectionDoc(
  payload: Payload,
  req: PayloadRequest,
  args: {
    collection:
      | 'growth-milestones'
      | 'ops-asset-ladder-items'
      | 'ops-liability-items'
      | 'ops-scorecard-rows'
    data: Record<string, unknown>
    keyField: string
    keyValue: string
  },
) {
  const existingId = await payload
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
    .then((result) => result.docs[0]?.id)

  if (existingId != null) {
    return (payload as any).update({
      collection: args.collection,
      id: existingId,
      data: args.data,
      req,
    })
  }

  return (payload as any).create({
    collection: args.collection,
    data: args.data,
    req,
  })
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
