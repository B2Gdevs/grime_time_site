const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ''

export function getSupabasePublicEnv() {
  return {
    anonKey: supabaseAnonKey,
    url: supabaseUrl,
  }
}

export function isSupabaseAuthConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
