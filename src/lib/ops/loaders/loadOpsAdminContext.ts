import { redirect } from 'next/navigation'

import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'

export async function loadOpsAdminContext() {
  const auth = await getCurrentAuthContext()

  if (!auth.realUser) {
    redirect('/login')
  }

  if (!auth.isRealAdmin) {
    redirect('/')
  }

  return {
    payload: auth.payload,
    user: auth.realUser,
  }
}
