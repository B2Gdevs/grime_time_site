'use client'

import type { MutableRefObject } from 'react'
import { LoaderCircleIcon, RefreshCwIcon, SparklesIcon, UploadIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type {
  MediaAction,
  MediaKind,
  SectionMediaSlot,
} from '@/components/page-composer/drawer/PageComposerDrawerMediaTypes'

export function PageComposerDrawerMediaUploadGenerateCard({
  copilot,
  loadMediaLibrary,
  mediaActionsLocked,
  mediaKind,
  mediaLoading,
  mediaPrompt,
  mediaPromptId,
  mediaUploadInputRef,
  selectedMediaSlot,
  setMediaPrompt,
  submitMediaAction,
  submittingMediaAction,
}: {
  copilot: null | {
    openFocusedMediaSession: (args: { mode?: MediaKind; promptHint?: string }) => void
  }
  loadMediaLibrary: () => void
  mediaActionsLocked: boolean
  mediaKind: MediaKind
  mediaLoading: boolean
  mediaPrompt: string
  mediaPromptId: string
  mediaUploadInputRef: MutableRefObject<HTMLInputElement | null>
  selectedMediaSlot: SectionMediaSlot
  setMediaPrompt: (value: string) => void
  submitMediaAction: (args: {
    action: MediaAction
    file?: File
    mediaId?: null | number
    prompt?: string
    relationPath: string
    success: string
  }) => Promise<void>
  submittingMediaAction: null | MediaAction
}) {
  return (
    <div className={adminPanelChrome.cardRounded3xlP4}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Upload or generate</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Upload a file directly or generate a new {mediaKind} for this selected service row.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {copilot ? (
            <Button
              disabled={mediaActionsLocked}
              onClick={() =>
                copilot.openFocusedMediaSession({
                  mode: mediaKind,
                  promptHint: mediaPrompt,
                })
              }
              size="sm"
              type="button"
              variant="outline"
            >
              <SparklesIcon className="h-4 w-4" />
              Focused copilot
            </Button>
          ) : null}
          <Button disabled={mediaLoading} onClick={loadMediaLibrary} size="sm" type="button" variant="ghost">
            <RefreshCwIcon className={`h-4 w-4 ${mediaLoading ? 'animate-spin' : ''}`} />
            Refresh library
          </Button>
        </div>
      </div>

      <input
        accept={mediaKind === 'video' ? 'video/*' : 'image/*'}
        className="hidden"
        ref={mediaUploadInputRef}
        type="file"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file || !selectedMediaSlot) return
          await submitMediaAction({
            action: 'create-and-swap',
            file,
            relationPath: selectedMediaSlot.relationPath,
            success: `Updated ${selectedMediaSlot.label}.`,
          })
          event.currentTarget.value = ''
        }}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          disabled={mediaActionsLocked || submittingMediaAction !== null}
          onClick={() => mediaUploadInputRef.current?.click()}
          size="sm"
          type="button"
          variant="secondary"
        >
          {submittingMediaAction === 'create-and-swap' ? (
            <>
              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <UploadIcon className="h-4 w-4" />
              Upload and swap
            </>
          )}
        </Button>
        <Button
          disabled={mediaActionsLocked || submittingMediaAction !== null || !mediaPrompt.trim()}
          onClick={() => {
            if (!selectedMediaSlot) return
            void submitMediaAction({
              action: 'generate-and-swap',
              mediaId: selectedMediaSlot.mediaId,
              prompt: mediaPrompt,
              relationPath: selectedMediaSlot.relationPath,
              success: `Generated new ${mediaKind} for ${selectedMediaSlot.label}.`,
            })
          }}
          size="sm"
          type="button"
        >
          {submittingMediaAction === 'generate-and-swap' ? (
            <>
              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4" />
              Generate and swap
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 grid gap-2">
        <label className={adminPanelChrome.fieldLabel} htmlFor={mediaPromptId}>
          Prompt
        </label>
        <Textarea
          className="min-h-24"
          id={mediaPromptId}
          onChange={(event) => setMediaPrompt(event.target.value)}
          placeholder={`Describe the ${mediaKind} for ${selectedMediaSlot.label.toLowerCase()}...`}
          value={mediaPrompt}
        />
      </div>
    </div>
  )
}
