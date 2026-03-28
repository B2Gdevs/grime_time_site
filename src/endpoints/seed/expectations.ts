/**
 * Canonical keys the seed upserts — used by `grimetime seed check` and `seed delete` targeting.
 *
 * **Contract:** lists here must match push-time constants in `orchestrate-push.ts`:
 * `SEED_MEDIA` (filenames), `SEED_CATEGORIES` (slugs), `SEED_POST_SLUGS`, plus ops/CRM arrays
 * derived from `businessOperatingSystem` / `defaultCrmSequences`. CI: `expectations-alignment.int.spec.ts`.
 */
import {
  assetLadder as defaultAssetLadder,
  businessScorecard,
  growthMilestones as defaultGrowthMilestones,
  liabilityChecklist,
} from '@/lib/ops/businessOperatingSystem'

import { SCHEDULE_REQUEST_FORM_TITLE } from '@/lib/forms/scheduleRequest'
import { defaultInstantQuoteCatalog } from '@/lib/quotes/instantQuoteCatalog'

import { SEED_CONTACT_FORM_TITLE } from './contact-form'
import { demoAccounts, demoPersonas } from './demo-personas'
import { defaultCrmSequences } from './crm-sequences'
import { SEED_INSTANT_QUOTE_FORM_TITLE } from './instant-quote-form'

/** Media filenames upserted in seed (order matches orchestrate). */
export const EXPECTED_SEED_MEDIA_FILENAMES = [
  'image-post1.webp',
  'image-post2.webp',
  'image-post3.webp',
  'seed-grime-house.jpg',
  'seed-grime-driveway.jpg',
  'seed-grime-property.jpg',
] as const

export const EXPECTED_CATEGORY_SLUGS = [
  'technology',
  'news',
  'finance',
  'design',
  'software',
  'engineering',
] as const

export const EXPECTED_POST_SLUGS = [
  'digital-horizons',
  'global-gaze',
  'dollar-and-sense-the-financial-forecast',
] as const

export const EXPECTED_FORM_TITLES = [
  SEED_CONTACT_FORM_TITLE,
  SEED_INSTANT_QUOTE_FORM_TITLE,
  SCHEDULE_REQUEST_FORM_TITLE,
] as const

export const EXPECTED_PAGE_SLUGS = [
  'home',
  'contact',
  'about',
  'privacy-policy',
  'terms-and-conditions',
  'refund-policy',
  'contact-sla',
] as const

export const EXPECTED_GLOBAL_SLUGS = [
  'header',
  'footer',
  'pricing',
  'quoteSettings',
  'servicePlanSettings',
] as const

export const EXPECTED_CRM_SEQUENCE_KEYS = defaultCrmSequences.map((s) => s.key)

export const EXPECTED_GROWTH_MILESTONE_TITLES = defaultGrowthMilestones.map((m) => m.milestone)

export const EXPECTED_ASSET_LADDER_LABELS = defaultAssetLadder.map((a) => a.category)

export const EXPECTED_LIABILITY_LABELS = [...liabilityChecklist]

export const EXPECTED_SCORECARD_TITLES = businessScorecard.map((r) => r.name)

/** Post `title` field expected when slug matches (seed TS). */
export const EXPECTED_POST_TITLE_BY_SLUG: Record<(typeof EXPECTED_POST_SLUGS)[number], string> = {
  'digital-horizons': 'Digital Horizons: A Glimpse into Tomorrow',
  'global-gaze': 'Global Gaze: Beyond the Headlines',
  'dollar-and-sense-the-financial-forecast': 'Dollar and Sense: The Financial Forecast',
}

/** Page `title` field for drift checks (subset; policy pages often static). */
export const EXPECTED_PAGE_TITLE_BY_SLUG: Partial<Record<(typeof EXPECTED_PAGE_SLUGS)[number], string>> = {
  home: 'Home',
  contact: 'Contact',
}

export const EXPECTED_DEMO_ACCOUNT_NAMES = demoAccounts.map((a) => a.name)

export const EXPECTED_DEMO_PERSONA_EMAILS = demoPersonas.map((p) => p.email)

export const EXPECTED_DEMO_PERSONA_COUNT = demoPersonas.length

export const EXPECTED_DEMO_ACCOUNT_COUNT = demoAccounts.length

/** Drift checks for globals (subset of fields set in `pushGlobals`). */
export const EXPECTED_GLOBAL_HEADER_FIRST_NAV_LABEL = 'Home' as const

export const EXPECTED_PRICING_SECTION_TITLE = 'Quote estimator' as const

export const EXPECTED_QUOTE_SETTINGS_SERVICE_COUNT = defaultInstantQuoteCatalog.services.length

export const EXPECTED_SERVICE_PLAN_DEFAULT_CADENCE_MONTHS = 6 as const

/** Footer `navItems` length after full seed (`pushGlobals`). */
export const EXPECTED_FOOTER_NAV_ITEM_MIN = 6 as const
