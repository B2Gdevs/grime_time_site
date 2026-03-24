import { engageBayProvider } from './providers/engagebay'
import { hubSpotProvider } from './providers/hubspot'
import { readStoredCrmProvider, writeStoredCrmProvider } from './providerState'
import type { CrmProvider, CrmProviderSlug, CrmProviderSummary, CrmSyncResult, SubmissionRow } from './types'

const crmProviders: CrmProvider[] = [engageBayProvider, hubSpotProvider]

export function getCrmProviderSummaries(): CrmProviderSummary[] {
  return crmProviders.map((provider) => ({
    configured: provider.isConfigured(),
    label: provider.label,
    slug: provider.slug,
  }))
}

export function getConfiguredCrmProviders(): CrmProvider[] {
  return crmProviders.filter((provider) => provider.isConfigured())
}

function findCrmProvider(slug: CrmProviderSlug): CrmProvider | null {
  return crmProviders.find((provider) => provider.slug === slug) ?? null
}

export async function getActiveCrmProvider(): Promise<CrmProvider | null> {
  const configuredProviders = getConfiguredCrmProviders()

  if (configuredProviders.length === 0) {
    return null
  }

  const storedProvider = await readStoredCrmProvider()
  if (storedProvider) {
    const provider = findCrmProvider(storedProvider)
    if (provider?.isConfigured()) {
      return provider
    }
  }

  return configuredProviders[0] ?? null
}

export async function getCrmRuntimeState(): Promise<{
  activeProvider: CrmProviderSlug | null
  availableProviders: CrmProviderSummary[]
}> {
  const activeProvider = await getActiveCrmProvider()

  return {
    activeProvider: activeProvider?.slug ?? null,
    availableProviders: getCrmProviderSummaries(),
  }
}

export async function setActiveCrmProvider(slug: CrmProviderSlug): Promise<{
  activeProvider: CrmProviderSlug
  availableProviders: CrmProviderSummary[]
}> {
  const provider = findCrmProvider(slug)

  if (!provider?.isConfigured()) {
    throw new Error(`CRM provider "${slug}" is not configured.`)
  }

  await writeStoredCrmProvider(slug)

  return {
    activeProvider: provider.slug,
    availableProviders: getCrmProviderSummaries(),
  }
}

export async function syncFormSubmissionToActiveCrm(rows: SubmissionRow[]): Promise<CrmSyncResult> {
  const provider = await getActiveCrmProvider()

  if (!provider) {
    return {
      detail: 'No configured CRM provider is available.',
      status: 'skipped_no_api_key',
    }
  }

  return provider.syncFormSubmission({ rows })
}
