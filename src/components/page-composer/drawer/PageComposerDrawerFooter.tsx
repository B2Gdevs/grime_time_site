'use client'

import { LoaderCircleIcon, RocketIcon, SquarePenIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Button } from '@/components/ui/button'
import type { PageComposerDocument } from '@/lib/pages/pageComposer'

export function PageComposerDrawerFooter({
  draftPage,
  persistPage,
  restoringVersionId,
  savingAction,
  status,
}: {
  draftPage: null | PageComposerDocument
  persistPage: (action: 'publish-page' | 'save-draft') => Promise<void>
  restoringVersionId: null | string
  savingAction: null | 'publish-page' | 'save-draft'
  status: null | string
}) {
  return (
    <div className={adminPanelChrome.drawerFooterStrip}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button disabled={!draftPage || savingAction !== null || restoringVersionId !== null} onClick={() => void persistPage('save-draft')} size="sm" type="button" variant="outline">
            {savingAction === 'save-draft' ? (
              <>
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <SquarePenIcon className="h-4 w-4" />
                Save draft
              </>
            )}
          </Button>
          <Button disabled={!draftPage || savingAction !== null || restoringVersionId !== null} onClick={() => void persistPage('publish-page')} size="sm" type="button">
            {savingAction === 'publish-page' ? (
              <>
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <RocketIcon className="h-4 w-4" />
                Publish
              </>
            )}
          </Button>
        </div>
        {status ? (
          <div className="max-w-full text-right text-xs text-muted-foreground" role="status" aria-live="polite">
            {status}
          </div>
        ) : null}
      </div>
    </div>
  )
}
