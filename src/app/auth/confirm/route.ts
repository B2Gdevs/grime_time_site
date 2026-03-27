import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

import { completePortalAccessClaim } from '@/lib/auth/portal-access/claims'
import { sanitizeNextPath } from '@/lib/auth/redirect'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getServerSideURL } from '@/utilities/getURL'

const SUPPORTED_OTP_TYPES = new Set<EmailOtpType>([
  'email',
  'invite',
  'magiclink',
  'recovery',
  'signup',
])

function isSupportedOtpType(type: null | string): type is EmailOtpType {
  return Boolean(type && SUPPORTED_OTP_TYPES.has(type as EmailOtpType))
}

function destinationForType(type: null | string, nextPath: string) {
  if (type === 'recovery') {
    return '/reset-password'
  }

  return nextPath
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const claimToken = url.searchParams.get('claim')
  const nextPath = sanitizeNextPath(url.searchParams.get('next'))
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  const supabase = await getSupabaseServerClient()

  if (!supabase) {
    return NextResponse.redirect(new URL('/login?error=supabase-auth-disabled', getServerSideURL()))
  }

  if (tokenHash && isSupportedOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (!error) {
      if (claimToken) {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user?.id && user.email) {
          await completePortalAccessClaim({
            supabaseAuthUserID: user.id,
            token: claimToken,
            verifiedEmail: user.email,
          })
        }
      }

      return NextResponse.redirect(new URL(destinationForType(type, nextPath), getServerSideURL()))
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (claimToken) {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user?.id && user.email) {
          await completePortalAccessClaim({
            supabaseAuthUserID: user.id,
            token: claimToken,
            verifiedEmail: user.email,
          })
        }
      }

      return NextResponse.redirect(new URL(nextPath, getServerSideURL()))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth-link-invalid', getServerSideURL()))
}
