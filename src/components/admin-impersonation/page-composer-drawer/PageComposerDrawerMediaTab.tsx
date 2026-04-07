'use client'

import type { MutableRefObject } from 'react'

import {
  PageComposerDrawerMediaSectionHeader,
} from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaSectionHeader'
import {
  PageComposerDrawerMediaSelectedSlotDetails,
} from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaSelectedSlotDetails'
import {
  PageComposerDrawerMediaSelectedSlotPreview,
} from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaSelectedSlotPreview'
import {
  PageComposerDrawerMediaSlotList,
} from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaSlotList'
import {
  PageComposerDrawerMediaStateMessage,
} from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaStateMessage'
import {
  PageComposerDrawerMediaUploadGenerateCard,
} from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaUploadGenerateCard'
import {
  PageComposerDrawerRecentMediaLibrary,
} from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerRecentMediaLibrary'
import type {
  MediaAction,
  MediaLibraryItem,
  MediaSectionSummary,
  SectionMediaSlot,
} from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaTypes'
import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'

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
  mediaPrompt,
  mediaPromptId,
  mediaSlots,
  selectedIndex,
  selectedMediaSlot,
  selectedServiceGrid,
  setMediaKind,
  setMediaPrompt,
  setSelectedMediaPath,
  submitMediaAction,
  submittingMediaAction,
  mediaUploadInputRef,
}: {
  copilot: null | {
    openFocusedMediaSession: (args: { mode?: 'image' | 'video'; promptHint?: string }) => void
  }
  dirty: boolean
  draftPage: null | { pagePath: string }
  loadMediaLibrary: () => void
  loading: boolean
  mediaActionsLocked: boolean
  mediaKind: 'image' | 'video'
  mediaLibrary: MediaLibraryItem[]
  mediaLoading: boolean
  mediaPrompt: string
  mediaPromptId: string
  mediaSlots: SectionMediaSlot[]
  selectedIndex: number
  selectedMediaSlot: SectionMediaSlot | null
  selectedServiceGrid: MediaSectionSummary
  setMediaKind: (value: 'image' | 'video') => void
  setMediaPrompt: (value: string) => void
  setSelectedMediaPath: (value: null | string) => void
  submitMediaAction: (args: {
    action: MediaAction
    file?: File
    mediaId?: number | null
    prompt?: string
    relationPath: string
    success: string
  }) => Promise<void>
  submittingMediaAction: null | MediaAction
  mediaUploadInputRef: MutableRefObject<HTMLInputElement | null>
}) {
  const shouldShowFallback = loading || !draftPage || selectedIndex < 0 || !selectedServiceGrid

  if (shouldShowFallback) {
    return (
      <div className="grid gap-4">
        <PageComposerDrawerMediaStateMessage
          draftPage={draftPage}
          loading={loading}
          selectedIndex={selectedIndex}
          selectedServiceGrid={selectedServiceGrid}
        />
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <PageComposerDrawerMediaSectionHeader mediaSlots={mediaSlots.length} selectedHeading={selectedServiceGrid.heading || 'Service section'} />

      {dirty ? (
        <div className={adminPanelChrome.warnAmber}>
          Save draft before changing media. Media actions run against the persisted draft layout so relation paths stay aligned with the current section structure.
        </div>
      ) : null}

      <PageComposerDrawerMediaSlotList
        mediaSlots={mediaSlots}
        selectedMediaSlot={selectedMediaSlot}
        setMediaKind={setMediaKind}
        setSelectedMediaPath={setSelectedMediaPath}
      />

      {selectedMediaSlot ? (
        <>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <PageComposerDrawerMediaSelectedSlotPreview selectedMediaSlot={selectedMediaSlot} />
            <PageComposerDrawerMediaSelectedSlotDetails
              mediaKind={mediaKind}
              selectedMediaSlot={selectedMediaSlot}
              setMediaKind={setMediaKind}
            />
          </div>

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

          <PageComposerDrawerRecentMediaLibrary
            loadMediaLibrary={loadMediaLibrary}
            mediaActionsLocked={mediaActionsLocked}
            mediaLibrary={mediaLibrary}
            mediaLoading={mediaLoading}
            selectedMediaSlot={selectedMediaSlot}
            submitMediaAction={submitMediaAction}
            submittingMediaAction={submittingMediaAction}
          />
        </>
      ) : null}
    </div>
  )
}

