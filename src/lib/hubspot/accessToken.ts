/** Shared token resolution for HubSpot REST (private app / OAuth token). */
export function getHubSpotAccessToken(): string | null {
  return (
    process.env.HUBSPOT_ACCESS_TOKEN?.trim() ||
    process.env.HUBSPOT_PRIVATE_APP_TOKEN?.trim() ||
    null
  )
}

export function hubSpotTokenConfigured(): boolean {
  return Boolean(getHubSpotAccessToken())
}
