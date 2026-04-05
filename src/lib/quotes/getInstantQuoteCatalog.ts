import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import type { QuoteSetting } from '@/payload-types'
import {
  defaultInstantQuoteCatalog,
  normalizeInstantQuoteCatalog,
  type InstantQuoteCatalog,
} from '@/lib/quotes/instantQuoteCatalog'

function mapQuoteSettingsToCatalog(doc?: QuoteSetting | null): InstantQuoteCatalog {
  if (!doc) {
    return defaultInstantQuoteCatalog
  }

  return normalizeInstantQuoteCatalog({
    services:
      doc.services?.map((service) => ({
        key: service.serviceKey,
        label: service.label,
        description: service.description,
        recommendedFor: service.recommendedFor,
        measurementMode: service.serviceKey === 'house_wash' ? 'walls' : 'sqft',
        minimum: typeof service.minimum === 'number' ? service.minimum : 0,
        sqftLowRate: typeof service.sqftLowRate === 'number' ? service.sqftLowRate : 0,
        sqftHighRate: typeof service.sqftHighRate === 'number' ? service.sqftHighRate : 0,
        enabledOnSite: service.enabledOnSite !== false,
        quoteEnabled: service.quoteEnabled !== false,
        frequencyEligible: service.frequencyEligible !== false,
        sortOrder: typeof service.sortOrder === 'number' ? service.sortOrder : 0,
        priceBandLabel: '',
      })) ?? [],
    conditionMultipliers: {
      light:
        typeof doc.conditionMultipliers?.light === 'number'
          ? doc.conditionMultipliers.light
          : defaultInstantQuoteCatalog.conditionMultipliers.light,
      standard:
        typeof doc.conditionMultipliers?.standard === 'number'
          ? doc.conditionMultipliers.standard
          : defaultInstantQuoteCatalog.conditionMultipliers.standard,
      heavy:
        typeof doc.conditionMultipliers?.heavy === 'number'
          ? doc.conditionMultipliers.heavy
          : defaultInstantQuoteCatalog.conditionMultipliers.heavy,
    },
    storyMultipliers: {
      '1':
        typeof doc.storyMultipliers?.oneStory === 'number'
          ? doc.storyMultipliers.oneStory
          : defaultInstantQuoteCatalog.storyMultipliers['1'],
      '2':
        typeof doc.storyMultipliers?.twoStories === 'number'
          ? doc.storyMultipliers.twoStories
          : defaultInstantQuoteCatalog.storyMultipliers['2'],
      '3+':
        typeof doc.storyMultipliers?.threePlusStories === 'number'
          ? doc.storyMultipliers.threePlusStories
          : defaultInstantQuoteCatalog.storyMultipliers['3+'],
    },
    frequencyMultipliers: {
      one_time:
        typeof doc.frequencyMultipliers?.oneTime === 'number'
          ? doc.frequencyMultipliers.oneTime
          : defaultInstantQuoteCatalog.frequencyMultipliers.one_time,
      biannual:
        typeof doc.frequencyMultipliers?.biannual === 'number'
          ? doc.frequencyMultipliers.biannual
          : defaultInstantQuoteCatalog.frequencyMultipliers.biannual,
      quarterly:
        typeof doc.frequencyMultipliers?.quarterly === 'number'
          ? doc.frequencyMultipliers.quarterly
          : defaultInstantQuoteCatalog.frequencyMultipliers.quarterly,
    },
    houseWashPricing: {
      oneStoryPerWall:
        typeof doc.houseWashPricing?.oneStoryPerWall === 'number'
          ? doc.houseWashPricing.oneStoryPerWall
          : defaultInstantQuoteCatalog.houseWashPricing.oneStoryPerWall,
      twoStoryPerWall:
        typeof doc.houseWashPricing?.twoStoryPerWall === 'number'
          ? doc.houseWashPricing.twoStoryPerWall
          : defaultInstantQuoteCatalog.houseWashPricing.twoStoryPerWall,
      minimumWalls:
        typeof doc.houseWashPricing?.minimumWalls === 'number'
          ? doc.houseWashPricing.minimumWalls
          : defaultInstantQuoteCatalog.houseWashPricing.minimumWalls,
      manualReviewNote:
        doc.houseWashPricing?.manualReviewNote?.trim() ||
        defaultInstantQuoteCatalog.houseWashPricing.manualReviewNote,
    },
    messaging: {
      estimateDisclaimer:
        doc.estimatorMessaging?.estimateDisclaimer?.trim() ||
        defaultInstantQuoteCatalog.messaging.estimateDisclaimer,
      waterAccessNote:
        doc.estimatorMessaging?.waterAccessNote?.trim() ||
        defaultInstantQuoteCatalog.messaging.waterAccessNote,
      drivewayPhotoNote:
        doc.estimatorMessaging?.drivewayPhotoNote?.trim() ||
        defaultInstantQuoteCatalog.messaging.drivewayPhotoNote,
      commercialExpansionNote:
        doc.estimatorMessaging?.commercialExpansionNote?.trim() ||
        defaultInstantQuoteCatalog.messaging.commercialExpansionNote,
    },
  })
}

export async function getInstantQuoteCatalog({
  draft = false,
  payload,
}: {
  draft?: boolean
  payload?: Payload
} = {}): Promise<InstantQuoteCatalog> {
  const instance = payload ?? (await getPayload({ config }))

  try {
    const doc = await instance.findGlobal({
      slug: 'quoteSettings',
      draft,
      depth: 0,
    })

    return mapQuoteSettingsToCatalog(doc as QuoteSetting)
  } catch (error) {
    instance.logger.warn({
      err: error,
      msg: 'Instant quote settings unavailable; falling back to default catalog.',
    })

    return defaultInstantQuoteCatalog
  }
}
