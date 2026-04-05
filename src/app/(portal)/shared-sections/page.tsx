import { redirect } from 'next/navigation'

import { SharedSectionsLibrary } from '@/components/portal/shared-sections/SharedSectionsLibrary'
import { SiteHeader } from '@/components/site-header'
import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { resolveSharedSectionPermissions } from '@/lib/auth/sharedSectionPermissions'
import { loadSharedSectionsLibrary } from '@/lib/pages/sharedSectionLibrary'

export default async function SharedSectionsPage() {
  const auth = await getCurrentAuthContext()

  if (!auth.realUser) {
    redirect('/login')
  }

  if (!auth.isRealAdmin) {
    redirect('/')
  }

  const permissions = await resolveSharedSectionPermissions(auth.payload, auth.realUser)

  if (!permissions.canViewLibrary) {
    redirect('/ops')
  }

  const initialData = await loadSharedSectionsLibrary({
    auth,
  })

  return (
    <>
      <SiteHeader
        title="Shared sections"
        description="Manage linked section sources before they are inserted into service, location, and campaign pages."
      />
      <div className="@container/main flex flex-col py-4 md:py-6">
        <SharedSectionsLibrary initialData={initialData} />
      </div>
    </>
  )
}
