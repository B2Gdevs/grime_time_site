export const serviceGridDisplayVariants = ['interactive', 'featureCards', 'pricingSteps'] as const

export type ServiceGridDisplayVariant = (typeof serviceGridDisplayVariants)[number]

export const serviceGridDisplayVariantOptions = [
  {
    label: 'Interactive detail',
    value: 'interactive',
  },
  {
    label: 'Feature cards',
    value: 'featureCards',
  },
  {
    label: 'Pricing steps',
    value: 'pricingSteps',
  },
] as const

type ServiceGridVariantInput = {
  displayVariant?: string | null
  heading?: string | null
}

export function resolveServiceGridDisplayVariant(
  block: ServiceGridVariantInput | null | undefined,
): ServiceGridDisplayVariant {
  if (
    block?.displayVariant &&
    serviceGridDisplayVariants.includes(block.displayVariant as ServiceGridDisplayVariant)
  ) {
    return block.displayVariant as ServiceGridDisplayVariant
  }

  const headingKey = block?.heading?.trim().toLowerCase() || ''

  if (headingKey === 'what we do') {
    return 'featureCards'
  }

  if (headingKey === 'how our pricing works') {
    return 'pricingSteps'
  }

  return 'interactive'
}
