'use client'

import { type MutableRefObject, useRef, useState } from 'react'
import { InfoIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { COPILOT_MEDIA_GENERATION_ENABLED } from '@/constants/copilotFeatures'
import { PageComposerMediaGallery } from '@/components/page-composer/drawer/PageComposerMediaGallery'
import { PageComposerDrawerMediaSelectedSlotDetails } from '@/components/page-composer/drawer/PageComposerDrawerMediaSelectedSlotDetails'
import { PageComposerDrawerMediaSelectedSlotPreview } from '@/components/page-composer/drawer/PageComposerDrawerMediaSelectedSlotPreview'
import { PageComposerDrawerMediaSlotList } from '@/components/page-composer/drawer/PageComposerDrawerMediaSlotList'
import type {
  MediaAction,
  MediaLibraryItem,
  SectionMediaSlot,
} from '@/components/page-composer/drawer/PageComposerDrawerMediaTypes'
import { PageComposerDrawerMediaUploadGenerateCard } from '@/components/page-composer/drawer/PageComposerDrawerMediaUploadGenerateCard'
import { usePortalCopilotOptional } from '@/components/copilot/PortalCopilotContext'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { PageComposerDocument } from '@/lib/pages/pageComposer'

export function PageComposerDrawerMediaTab({
  copilot,
  dirty,
  draftPage,
  loadMediaLibrary,
  loading,
  mediaActionsLocked,
  mediaKind,
  mediaLibrary,
  mediaLoading,
  mediaSlots,
  mediaPrompt,
  mediaPromptId,
  mediaUploadInputRef,
  setMediaKind,
  setMediaPrompt,
  setSelectedMediaPath,
  selectedMediaSlot,
  submitMediaAction,
  submittingMediaAction,
}: {
  copilot: null | {
    openFocusedMediaSession: (args: { mode?: 'image' | 'video'; promptHint?: string }) => void
  }
  dirty: boolean
  draftPage: null | PageComposerDocument
  loadMediaLibrary: () => void
  loading: boolean
  mediaActionsLocked: boolean
  mediaKind: 'image' | 'video'
  mediaLibrary: MediaLibraryItem[]
  mediaLoading: boolean
  mediaSlots: SectionMediaSlot[]
  mediaPrompt: string
  mediaPromptId: string
  mediaUploadInputRef: MutableRefObject<HTMLInputElement | null>
  setMediaKind: (value: 'image' | 'video') => void
  setMediaPrompt: (value: string) => void
  setSelectedMediaPath: (value: null | string) => void
  selectedMediaSlot: SectionMediaSlot | null
  submitMediaAction: (args: {
    action: MediaAction
    file?: File
    mediaId?: number | null
    prompt?: string
    relationPath?: string
    success: string
  }) => Promise<void>
  submittingMediaAction: null | MediaAction
}) {
  const portalCopilot = usePortalCopilotOptional()
  const [replaceTargetId, setReplaceTargetId] = useState<null | number>(null)
  const replaceInputRef = useRef<HTMLInputElement | null>(null)
  const busy = submittingMediaAction !== null
  const dragDisabled = !draftPage || typeof draftPage.id !== 'number'

  function openGenerateInCopilot(item: MediaLibraryItem) {
    if (!portalCopilot || !COPILOT_MEDIA_GENERATION_ENABLED) {
      return
    }

    const label = item.alt || item.filename || `Media ${item.id}`

    portalCopilot.setAuthoringContext({
      libraryMedia: {
        id: item.id,
        label,
        mimeType: item.mimeType,
      },
      mediaSlot: null,
      page:
        draftPage && draftPage.id
          ? {
              id: draftPage.id,
              pagePath: draftPage.pagePath,
              slug: draftPage.slug,
              status: draftPage._status === 'published' ? 'published' : 'draft',
              title: draftPage.title || '',
              visibility: draftPage.visibility === 'private' ? 'private' : 'public',
            }
          : null,
      section: null,
      surface: 'media-library',
    })
    portalCopilot.openFocusedMediaSession({
      mode: 'image',
      promptHint: label,
    })
  }

  function requestReplaceFile(mediaId: number) {
    setReplaceTargetId(mediaId)
    requestAnimationFrame(() => replaceInputRef.current?.click())
  }

  if (loading || !draftPage) {
    return (
      <div className={adminPanelChrome.emptyOnBackground}>
        {loading ? 'Loading page…' : 'Open a page in the composer to use the media library.'}
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">Media library</h3>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="About the media library"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                data-page-composer-no-drag="true"
                type="button"
              >
                <InfoIcon aria-hidden className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[280px] text-xs leading-snug" side="bottom">
              Click a media area on the canvas (hero, section, or service row) to target it, then use this gallery.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {selectedMediaSlot ? (
        <p className="text-xs text-muted-foreground">
          Targeting <span className="font-medium text-foreground">{selectedMediaSlot.label}</span>
        </p>
      ) : mediaSlots.length ? (
        <p className="text-xs text-muted-foreground">
          Choose a slot from the selected block below, or click a media area on the canvas to focus it.
        </p>
      ) : (
        <div className={adminPanelChrome.emptyOnBackground}>
          Click a media area on the canvas (hero, section, or service row) to target it, then use the gallery below.
        </div>
      )}

      {mediaSlots.length ? (
        <div className="grid gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Current block media slots
          </div>
          <PageComposerDrawerMediaSlotList
            mediaSlots={mediaSlots}
            selectedMediaSlot={selectedMediaSlot}
            setMediaKind={setMediaKind}
            setSelectedMediaPath={setSelectedMediaPath}
          />
        </div>
      ) : null}

      {selectedMediaSlot ? (
        <div className="grid gap-4">
          <PageComposerDrawerMediaUploadGenerateCard
            copilot={copilot}
            loadMediaLibrary={loadMediaLibrary}
            mediaActionsLocked={mediaActionsLocked}
            mediaKind={mediaKind}
            mediaLoading={mediaLoading}
            mediaPrompt={mediaPrompt}
            mediaPromptId={mediaPromptId}
            mediaUploadInputRef={mediaUploadInputRef}
            selectedMediaSlot={selectedMediaSlot}
            setMediaPrompt={setMediaPrompt}
            submitMediaAction={submitMediaAction}
            submittingMediaAction={submittingMediaAction}
          />
        </div>
      ) : null}

      {dirty ? (
        <div className={adminPanelChrome.warnAmber}>
          Draft changes are auto-saved. Dragging library tiles onto canvas media slots stays available while you edit.
        </div>
      ) : null}

      <input
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          const targetId = replaceTargetId
          setReplaceTargetId(null)
          if (!file || !targetId) return
          void submitMediaAction({
            action: 'replace-existing',
            file,
            mediaId: targetId,
            success: 'Media file replaced.',
          })
        }}
        ref={replaceInputRef}
        type="file"
      />

      <PageComposerMediaGallery
        busy={busy}
        dragDisabled={dragDisabled}
        loadMediaLibrary={loadMediaLibrary}
        mediaActionsLocked={mediaActionsLocked}
        mediaKind={mediaKind}
        mediaLibrary={mediaLibrary}
        mediaLoading={mediaLoading}
        mediaPrompt={mediaPrompt}
        onGenerateItem={
          COPILOT_MEDIA_GENERATION_ENABLED ? openGenerateInCopilot : undefined
        }
        requestReplaceFile={requestReplaceFile}
        selectedMediaSlot={selectedMediaSlot}
        setMediaKind={setMediaKind}
        setMediaPrompt={setMediaPrompt}
        submitMediaAction={submitMediaAction}
      />
    </div>
  )
}
