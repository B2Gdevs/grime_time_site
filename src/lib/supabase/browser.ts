'use client'

import { createBrowserClient } from '@supabase/ssr'

import { getSupabasePublicEnv, isSupabaseAuthConfigured } from '@/lib/supabase/config'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient
  }

  if (!isSupabaseAuthConfigured()) {
    throw new Error('Supabase Auth is not configured.')
  }

  const env = getSupabasePublicEnv()
  browserClient = createBrowserClient(env.url, env.anonKey)

  return browserClient
}
