import { isSupabaseCustomerAuthFallbackEnabledServer } from '@/lib/auth/customerAuthMode'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function POST() {
  if (!isSupabaseCustomerAuthFallbackEnabledServer()) {
    return Response.json({ success: true })
  }

  const supabase = await getSupabaseServerClient()

  if (supabase) {
    await supabase.auth.signOut()
  }

  return Response.json({ success: true })
}
