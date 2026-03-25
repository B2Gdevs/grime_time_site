import { getHubSpotAccessToken } from '@/lib/hubspot/accessToken'

const BASE = 'https://api.hubapi.com'

export type HubSpotHealthResult =
  | { ok: true }
  | { ok: false; message: string; status?: number }

export type HubSpotTaskRow = {
  id: string
  subject: string
  status: string | null
  ownerId: string | null
  /** Resolved via CRM owners API when available. */
  ownerName: string | null
  dueMs: number | null
}

export type HubSpotPipelineSummary = {
  openDealCount: number
  openPipelineTotal: number
  currencyCode: string | null
}

function headers(): Record<string, string> {
  const token = getHubSpotAccessToken()
  if (!token) throw new Error('HubSpot token not configured.')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function hubSpotHealthCheck(): Promise<HubSpotHealthResult> {
  const token = getHubSpotAccessToken()
  if (!token) {
    return { ok: false, message: 'HubSpot token not configured (HUBSPOT_ACCESS_TOKEN or HUBSPOT_PRIVATE_APP_TOKEN).' }
  }

  try {
    const res = await fetch(`${BASE}/crm/v3/objects/deals?limit=1`, {
      headers: headers(),
      method: 'GET',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return {
        ok: false,
        message: text.slice(0, 280) || `HubSpot returned ${res.status}`,
        status: res.status,
      }
    }
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'HubSpot health request failed',
    }
  }
}

async function hubSpotOwnersNameMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  try {
    const res = await fetch(`${BASE}/crm/v3/owners?limit=500`, {
      headers: headers(),
      method: 'GET',
    })
    if (!res.ok) return map
    const body = (await res.json().catch(() => ({}))) as {
      results?: Array<{ id: string | number; firstName?: string; lastName?: string; email?: string }>
    }
    for (const o of body.results ?? []) {
      const name =
        [o.firstName, o.lastName].filter(Boolean).join(' ').trim() || o.email?.trim() || `Owner ${o.id}`
      map.set(String(o.id), name)
    }
  } catch {
    /* ignore — tasks still show owner id */
  }
  return map
}

/** Tasks whose due timestamp falls in [fromMs, toMs] (inclusive), best-effort. */
export async function hubSpotTasksDueInRange(
  fromMs: number,
  toMs: number,
): Promise<{ tasks: HubSpotTaskRow[]; error?: string }> {
  try {
    const res = await fetch(`${BASE}/crm/v3/objects/tasks/search`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'hs_timestamp',
                operator: 'GTE',
                value: String(fromMs),
              },
              {
                propertyName: 'hs_timestamp',
                operator: 'LTE',
                value: String(toMs),
              },
            ],
          },
        ],
        properties: ['hs_task_subject', 'hs_task_status', 'hubspot_owner_id', 'hs_timestamp'],
        limit: 100,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return {
        tasks: [],
        error: `HubSpot tasks search failed (${res.status}): ${text.slice(0, 200)}`,
      }
    }

    const body = (await res.json().catch(() => ({}))) as {
      results?: Array<{
        id: string
        properties?: Record<string, string | null>
      }>
    }

    const ownerMap = await hubSpotOwnersNameMap()

    const tasks: HubSpotTaskRow[] = (body.results ?? []).map((r) => {
      const p = r.properties ?? {}
      const dueRaw = p.hs_timestamp
      const dueMs = dueRaw != null && dueRaw !== '' ? Number(dueRaw) : null
      const ownerId = p.hubspot_owner_id ?? null

      return {
        id: r.id,
        subject: p.hs_task_subject?.trim() || '(No subject)',
        status: p.hs_task_status ?? null,
        ownerId,
        ownerName: ownerId ? ownerMap.get(String(ownerId)) ?? null : null,
        dueMs: Number.isFinite(dueMs) ? dueMs : null,
      }
    })

    return { tasks }
  } catch (e) {
    return {
      tasks: [],
      error: e instanceof Error ? e.message : 'Unknown error loading tasks',
    }
  }
}

/** Open deals: sum of `amount` (numeric) where hs_is_closed is false. */
export async function hubSpotOpenPipelineSummary(): Promise<{
  summary: HubSpotPipelineSummary | null
  error?: string
}> {
  try {
    const res = await fetch(`${BASE}/crm/v3/objects/deals/search`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'hs_is_closed',
                operator: 'EQ',
                value: 'false',
              },
            ],
          },
        ],
        properties: ['amount', 'dealcurrencycode'],
        limit: 100,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return {
        summary: null,
        error: `HubSpot deals search failed (${res.status}): ${text.slice(0, 200)}`,
      }
    }

    const body = (await res.json().catch(() => ({}))) as {
      results?: Array<{ properties?: Record<string, string | null> }>
    }

    let total = 0
    let currency: string | null = null
    for (const row of body.results ?? []) {
      const p = row.properties ?? {}
      if (!currency && p.dealcurrencycode) currency = p.dealcurrencycode
      const amt = p.amount != null && p.amount !== '' ? Number.parseFloat(String(p.amount)) : 0
      if (Number.isFinite(amt)) total += amt
    }

    return {
      summary: {
        openDealCount: body.results?.length ?? 0,
        openPipelineTotal: total,
        currencyCode: currency,
      },
    }
  } catch (e) {
    return {
      summary: null,
      error: e instanceof Error ? e.message : 'Unknown error loading pipeline',
    }
  }
}

export function formatCurrencyUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

export function formatPipelineAmount(total: number, currencyCode: string | null): string {
  const code =
    currencyCode && /^[A-Z]{3}$/i.test(currencyCode.trim()) ? currencyCode.trim().toUpperCase() : 'USD'
  try {
    return new Intl.NumberFormat('en-US', {
      currency: code,
      maximumFractionDigits: 0,
      style: 'currency',
    }).format(total)
  } catch {
    return formatCurrencyUsd(total)
  }
}
