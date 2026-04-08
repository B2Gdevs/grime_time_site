import { InstantQuoteSection } from '@/components/InstantQuoteSection'
import type { InstantQuoteCatalog } from '@/lib/quotes/instantQuoteCatalog'

export function ServiceEstimatorBlock({ catalog }: { catalog: InstantQuoteCatalog }) {
  return <InstantQuoteSection catalog={catalog} />
}
