import { PORTAL_ACCESS_TOKEN_QUERY_KEY } from '@/lib/auth/portal-access/constants'
import { getServerSideURL } from '@/utilities/getURL'

export function createPortalAccessLink(args: { nextPath?: string; token: string }): string {
  const url = new URL('/claim-account', getServerSideURL())
  url.searchParams.set(PORTAL_ACCESS_TOKEN_QUERY_KEY, args.token)

  if (args.nextPath) {
    url.searchParams.set('next', args.nextPath)
  }

  return url.toString()
}
