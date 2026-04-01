import { headers } from 'next/headers'

function normalizeHost(host: null | string | undefined): string {
  const first = (host || '').split(',')[0]?.trim().toLowerCase() || ''

  if (!first) {
    return ''
  }

  if (first.startsWith('[') && first.includes(']')) {
    return first.slice(1, first.indexOf(']'))
  }

  return first.split(':')[0] || ''
}

export function isLocalDevtoolsHost(host: null | string | undefined): boolean {
  const normalized = normalizeHost(host)

  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1'
}

export function isLocalDevtoolsRequestHeaders(requestHeaders: Headers): boolean {
  return isLocalDevtoolsHost(requestHeaders.get('x-forwarded-host') || requestHeaders.get('host'))
}

export async function isLocalDevtoolsRequest(): Promise<boolean> {
  const requestHeaders = await headers()
  return isLocalDevtoolsRequestHeaders(requestHeaders)
}
