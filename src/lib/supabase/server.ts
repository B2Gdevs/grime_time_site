import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { getSupabasePublicEnv, isSupabaseAuthConfigured } from '@/lib/supabase/config'

export async function getSupabaseServerClient() {
  if (!isSupabaseAuthConfigured()) {
    return null
  }

  const cookieStore = await cookies()
  const env = getSupabasePublicEnv()

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie.name, cookie.value, cookie.options)
          }
        } catch {
          // Server Components cannot always mutate cookies; route handlers still can.
        }
      },
    },
  })
}

export async function getSupabaseServerUser() {
  const supabase = await getSupabaseServerClient()

  if (!supabase) {
    return null
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user ?? null
}
