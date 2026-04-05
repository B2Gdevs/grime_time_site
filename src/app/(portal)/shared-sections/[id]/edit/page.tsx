import { notFound, redirect } from 'next/navigation'

import { SharedSectionEditor } from '@/components/portal/shared-sections/SharedSectionEditor'
import { SiteHeader } from '@/components/site-header'
import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { resolveSharedSectionPermissions } from '@/lib/auth/sharedSectionPermissions'
import { loadSharedSectionsLibrary } from '@/lib/pages/sharedSectionLibrary'

export default async function SharedSectionEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sharedSectionId = Number(id)

  if (!Number.isInteger(sharedSectionId) || sharedSectionId <= 0) {
    notFound()
  }

  const auth = await getCurrentAuthContext()

  if (!auth.realUser) {
    redirect('/login')
  }

  if (!auth.isRealAdmin) {
    redirect('/')
  }

  const permissions = await resolveSharedSectionPermissions(auth.payload, auth.realUser)

  if (!permissions.canViewLibrary || !permissions.canEditDraft) {
    redirect('/shared-sections')
  }

  const result = await loadSharedSectionsLibrary({
    auth,
    id: sharedSectionId,
  })
  const item = result.items[0]

  if (!item) {
    notFound()
  }

  return (
    <>
      <SiteHeader
        title="Shared section editor"
        description="Edit the global shared-section source in a dedicated builder surface before publishing updates to linked pages."
      />
      <div className="@container/main flex flex-col py-4 md:py-6">
        <SharedSectionEditor initialItem={item} permissions={result.permissions} />
      </div>
    </>
  )
}
