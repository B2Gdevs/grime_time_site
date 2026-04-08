import type { Block } from 'payload'

import { blockVisibilityField } from '@/blocks/shared/blockVisibilityField'

export const ServiceEstimator: Block = {
  slug: 'serviceEstimator',
  interfaceName: 'ServiceEstimatorBlock',
  labels: {
    singular: 'Service estimator',
    plural: 'Service estimators',
  },
  fields: [
    blockVisibilityField,
  ],
}
