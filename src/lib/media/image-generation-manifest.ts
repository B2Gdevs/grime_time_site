/**
 * Single source of truth for AI marketing image prompts, wiring notes, and batches.
 * Used by `scripts/generate-marketing-images.ts` and documented in
 * `.planning/workflows/image-generation-mcp-and-media-workflow.md`.
 *
 * Tracking workflow:
 * - Use `npm run generate:marketing-images -- --list` to see batches, filenames, and `wiredTo`.
 * - After a good run, note dates in TASK-REGISTRY / phase SUMMARY if you treat it as a milestone.
 * - `enabled: false` keeps an entry in the manifest but skips generation until you flip it.
 */
import type { Media } from '@/payload-types'

import { image1 } from '@/endpoints/seed/image-1'
import { image2 } from '@/endpoints/seed/image-2'
import { imageSeedDriveway } from '@/endpoints/seed/image-seed-driveway'
import { imageSeedHouse } from '@/endpoints/seed/image-seed-house'
import { genericMediaSeed } from '@/endpoints/seed/image-seed-generic'
import { imageSeedProperty } from '@/endpoints/seed/image-seed-property'

export const SEED_DATA_BY_REF = {
  house: imageSeedHouse,
  driveway: imageSeedDriveway,
  property: imageSeedProperty,
  post1: image1,
  post2: image2,
  /** Seeded blog post 3 reuses the same caption template as post 2 in Payload seed. */
  post3: image2,
} as const satisfies Record<string, Omit<Media, 'createdAt' | 'id' | 'updatedAt'>>

export type SeedDataRef = keyof typeof SEED_DATA_BY_REF

export type ImageGenBatch = 'core' | 'posts' | 'extended'

type EntryBase = {
  id: string
  filename: string
  batch: ImageGenBatch
  /** High-level bucket for filtering in --list */
  category: string
  /** Human-readable: seed routes, blocks, or `library` if unassigned */
  wiredTo: string[]
  /** When false, shown in --list but not generated */
  enabled: boolean
  /** Model prompt fragment; combined via buildPromptForEntry */
  promptBody: string
  /** Default OpenAI size (gpt-image-1 typically 1024x1024) */
  size?: string
  notes?: string
  /** photo = residential/marketing realism; abstract/graphic = UI textures and charts */
  styleVariant?: 'photo' | 'abstract' | 'graphic'
}

export type ImageGenerationEntry =
  | (EntryBase & { seedRef: SeedDataRef })
  | (EntryBase & { seedRef: 'generic'; alt: string; caption: string })

export const GLOBAL_IMAGE_STYLE = {
  brandContext:
    'Context: premium exterior cleaning — pressure washing, soft washing, concrete, siding, commercial storefronts, Texas / Gulf Coast suburban and light commercial.',
  negativeConstraints:
    'No people, no faces, no readable text, no logos, no watermarks, no company branding, no phone numbers, no license plates legible.',
  photoPrefix:
    'Photorealistic professional marketing photograph, sharp focus, natural color, believable lighting.',
} as const

export function buildPromptForEntry(entry: ImageGenerationEntry): string {
  const n = GLOBAL_IMAGE_STYLE.negativeConstraints
  if (entry.styleVariant === 'abstract') {
    return `Abstract minimal editorial background, soft gradients and shapes, suitable behind UI. ${entry.promptBody} ${n}`
  }
  if (entry.styleVariant === 'graphic') {
    return `Clean modern graphic design, flat or soft 3D, UI illustration quality. ${entry.promptBody} ${n}`
  }
  return `${GLOBAL_IMAGE_STYLE.photoPrefix} ${GLOBAL_IMAGE_STYLE.brandContext} ${entry.promptBody} ${n}`
}

export function getSeedDataForEntry(entry: ImageGenerationEntry): Record<string, unknown> {
  if (entry.seedRef === 'generic') {
    return genericMediaSeed({ alt: entry.alt, caption: entry.caption }) as Record<string, unknown>
  }
  return SEED_DATA_BY_REF[entry.seedRef] as Record<string, unknown>
}

/** Ordered manifest: core → posts → extended (planned items at end with enabled: false). */
export const IMAGE_GENERATION_ENTRIES: ImageGenerationEntry[] = [
  // --- core (default npm run) ---
  {
    id: 'seed-grime-house',
    filename: 'seed-grime-house.jpg',
    batch: 'core',
    category: 'residential',
    wiredTo: ['seed:pages.home meta + galleryTop', 'seed:pages.about hero'],
    enabled: true,
    seedRef: 'house',
    styleVariant: 'photo',
    promptBody:
      'Well-maintained suburban Texas single-family home in bright daylight: siding, roofline, front porch visible. Curb appeal, clean surfaces, soft natural shadows. Establishing shot suitable for SEO/social and about hero.',
  },
  {
    id: 'seed-grime-driveway',
    filename: 'seed-grime-driveway.jpg',
    batch: 'core',
    category: 'residential',
    wiredTo: ['seed:pages.home hero (highImpact)', 'seed:pages.home galleryMid'],
    enabled: true,
    styleVariant: 'photo',
    notes: 'This file is the primary homepage hero background today — prioritize a dramatic, premium look.',
    seedRef: 'driveway',
    promptBody:
      'Cinematic wide hero shot of a pristine residential concrete driveway and approach, low camera angle, strong leading lines, dramatic partly cloudy sky with warm rim light. Suburban Texas context. Premium home-services advertising look, high contrast, immaculately clean flatwork after pressure washing — aspirational and bold, not flat or stock-looking.',
  },
  {
    id: 'seed-grime-property',
    filename: 'seed-grime-property.jpg',
    batch: 'core',
    category: 'residential',
    wiredTo: ['seed:pages.home galleryBottom', 'seed:pages.contact hero', 'seed:pages.about support'],
    enabled: true,
    seedRef: 'property',
    styleVariant: 'photo',
    promptBody:
      'Wide establishing shot of an attractive Texas residential property: lawn, trees, clean roofline and exterior. Golden hour or soft daylight. Whole-property scope feel for soft washing and packages.',
  },

  // --- posts ( --include-posts ) ---
  {
    id: 'image-post1',
    filename: 'image-post1.webp',
    batch: 'posts',
    category: 'blog',
    wiredTo: ['seed:posts[0] header'],
    enabled: true,
    seedRef: 'post1',
    styleVariant: 'abstract',
    promptBody: 'Cool blue and slate tones, subtle motion blur hints, technology and field operations mood.',
  },
  {
    id: 'image-post2',
    filename: 'image-post2.webp',
    batch: 'posts',
    category: 'blog',
    wiredTo: ['seed:posts[1] header'],
    enabled: true,
    seedRef: 'post2',
    styleVariant: 'abstract',
    promptBody: 'Teal and graphite palette, soft geometric shapes, business growth mood.',
  },
  {
    id: 'image-post3',
    filename: 'image-post3.webp',
    batch: 'posts',
    category: 'blog',
    wiredTo: ['seed:posts[2] header'],
    enabled: true,
    seedRef: 'post3',
    styleVariant: 'abstract',
    promptBody: 'Muted greens and neutrals, abstract flow lines suggesting scheduling and forecasting.',
  },

  // --- extended library ( --library or --with-library ) — not wired in seed until you assign in admin ---
  {
    id: 'seed-ui-texture-grunge',
    filename: 'seed-ui-texture-grunge-dark.jpg',
    batch: 'extended',
    category: 'ui-texture',
    wiredTo: ['library'],
    enabled: true,
    seedRef: 'generic',
    alt: 'Dark subtle noise texture for section backgrounds',
    caption:
      'Generated dark grunge texture for UI section backgrounds. Assign in layout blocks or CSS as needed.',
    styleVariant: 'abstract',
    promptBody:
      'Seamless-feel dark charcoal texture, very fine grain, subtle vignette, no hard shapes, suitable as a muted web section backdrop.',
  },
  {
    id: 'seed-ui-texture-concrete',
    filename: 'seed-ui-texture-concrete-light.jpg',
    batch: 'extended',
    category: 'ui-texture',
    wiredTo: ['library'],
    enabled: true,
    seedRef: 'generic',
    alt: 'Light concrete texture for cards and panels',
    caption: 'Light neutral concrete texture for cards, pricing panels, or dividers.',
    styleVariant: 'abstract',
    promptBody:
      'Top-down light gray concrete micro-texture, soft shadows, clean and minimal, suitable behind typography in UI mockups.',
  },
  {
    id: 'seed-ui-graph-abstract',
    filename: 'seed-ui-graph-abstract.jpg',
    batch: 'extended',
    category: 'ui-graphic',
    wiredTo: ['library'],
    enabled: true,
    seedRef: 'generic',
    alt: 'Abstract chart-inspired background',
    caption: 'Soft chart-like shapes for stats or KPI sections — not real data.',
    styleVariant: 'graphic',
    promptBody:
      'Soft abstract shapes suggesting charts and upward trends, blues and teals, plenty of negative space, no numbers or axes labels.',
  },
  {
    id: 'seed-grime-service-softwash',
    filename: 'seed-grime-service-softwash-siding.jpg',
    batch: 'extended',
    category: 'service',
    wiredTo: ['library', 'future:serviceGrid soft wash'],
    enabled: true,
    seedRef: 'generic',
    alt: 'Soft wash siding result on a house',
    caption: 'Soft washing / low-pressure siding — use on service cards or proof sections.',
    styleVariant: 'photo',
    promptBody:
      'Close-to-mid shot of vinyl or painted siding on a Texas home, clean and even finish, soft daylight, emphasis on gentle cleaning result (no damage look).',
  },
  {
    id: 'seed-grime-service-pressure-flatwork',
    filename: 'seed-grime-service-pressure-flatwork.jpg',
    batch: 'extended',
    category: 'service',
    wiredTo: ['library', 'future:serviceGrid pressure washing'],
    enabled: true,
    seedRef: 'generic',
    alt: 'Pressure-washed concrete flatwork',
    caption: 'Driveway or sidewalk cleaning result for flatwork service cards.',
    styleVariant: 'photo',
    promptBody:
      'Clean residential concrete driveway or sidewalk, sunlit, strong texture detail, obvious freshness after pressure washing.',
  },
  {
    id: 'seed-grime-service-deck',
    filename: 'seed-grime-service-deck-wood.jpg',
    batch: 'extended',
    category: 'service',
    wiredTo: ['library'],
    enabled: true,
    seedRef: 'generic',
    alt: 'Wood deck after gentle cleaning',
    caption: 'Wood deck or porch surface suitable for deck washing offers.',
    styleVariant: 'photo',
    promptBody:
      'Outdoor wood deck boards, rich natural wood tone, freshly cleaned appearance, railing visible, no people.',
  },
  {
    id: 'seed-grime-commercial-storefront',
    filename: 'seed-grime-commercial-storefront.jpg',
    batch: 'extended',
    category: 'commercial',
    wiredTo: ['library', 'future:commercial page'],
    enabled: true,
    seedRef: 'generic',
    alt: 'Commercial storefront and sidewalk',
    caption: 'Retail strip or storefront context for commercial cleaning narrative.',
    styleVariant: 'photo',
    promptBody:
      'Single-story retail storefront with large glass windows and concrete walk, early morning light, professional property management vibe, South Texas strip mall aesthetic.',
  },
  {
    id: 'seed-grime-commercial-plaza',
    filename: 'seed-grime-commercial-plaza.jpg',
    batch: 'extended',
    category: 'commercial',
    wiredTo: ['library'],
    enabled: true,
    seedRef: 'generic',
    alt: 'Office park or plaza paving',
    caption: 'Wide commercial plaza or office park paving — good for B2B hero or case studies.',
    styleVariant: 'photo',
    promptBody:
      'Office park exterior with wide paved plaza, palm or live oak trees, clean modern building facade, no signage readable.',
  },
  {
    id: 'seed-grime-commercial-dock',
    filename: 'seed-grime-commercial-dock-bay.jpg',
    batch: 'extended',
    category: 'commercial',
    wiredTo: ['library'],
    enabled: true,
    seedRef: 'generic',
    alt: 'Industrial loading area concrete',
    caption: 'Loading dock or service bay flatwork for industrial pressure washing stories.',
    styleVariant: 'photo',
    promptBody:
      'Industrial loading bay or warehouse approach with clean concrete, safety bollards, neutral daylight, no readable signage.',
  },
  {
    id: 'seed-grime-logo-mark',
    filename: 'seed-grime-logo-mark.png',
    batch: 'extended',
    category: 'brand',
    wiredTo: ['library', 'NOT for production logo — review with designer'],
    enabled: true,
    seedRef: 'generic',
    alt: 'Abstract brand mark concept (not final logo)',
    caption:
      'AI-generated abstract mark only — do not ship as final Grime Time logo without designer review. No text in image.',
    styleVariant: 'graphic',
    promptBody:
      'Abstract geometric brand mark suggesting water droplets and motion, bold simple shapes, single dark teal and black palette on transparent-style feel, centered, icon suitable for app icon exploration only, absolutely no letters or words.',
    notes: 'Raster PNG; final brand should be vector from a designer. Use as mood reference only.',
  },

  // --- backlog (manifest only; flip enabled when ready) ---
  {
    id: 'seed-grime-roof-gutter',
    filename: 'seed-grime-service-roof-gutter.jpg',
    batch: 'extended',
    category: 'service',
    wiredTo: ['library', 'backlog'],
    enabled: false,
    seedRef: 'generic',
    alt: 'Roofline and gutter close-up (planned)',
    caption: 'Placeholder entry — enable in manifest when ready to generate.',
    styleVariant: 'photo',
    promptBody:
      'Roof edge and gutter line on a suburban home, clean fascia, soft daylight, safety-conscious distance, no workers visible.',
    notes: 'Enable `enabled` when you want this asset generated.',
  },
]

export function entriesForBatches(batches: ImageGenBatch[]): ImageGenerationEntry[] {
  const set = new Set(batches)
  return IMAGE_GENERATION_ENTRIES.filter((e) => set.has(e.batch) && e.enabled)
}
