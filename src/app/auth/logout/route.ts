import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await getSupabaseServerClient()

  if (supabase) {
    await supabase.auth.signOut()
  }

  return Response.json({ success: true })
}
