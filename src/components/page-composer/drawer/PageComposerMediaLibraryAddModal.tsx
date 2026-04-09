'use client'

import { useId, useRef, useState } from 'react'
import { UploadIcon, Wand2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { MediaAction, MediaKind } from '@/components/page-composer/drawer/PageComposerDrawerMediaTypes'

function isAcceptableMediaFile(file: File) {
  return file.type.startsWith('image/') || file.type.startsWith('video/')
}

export function PageComposerMediaLibraryAddModal({
  busy,
  mediaKind,
  mediaPrompt,
  onOpenChange,
  open,
  setMediaKind,
  setMediaPrompt,
  submitMediaAction,
}: {
  busy: boolean
  mediaKind: MediaKind
  mediaPrompt: string
  onOpenChange: (open: boolean) => void
  open: boolean
  setMediaKind: (value: MediaKind) => void
  setMediaPrompt: (value: string) => void
  submitMediaAction: (args: {
    action: MediaAction
    file?: File
    mediaId?: number | null
    prompt?: string
    relationPath?: string
    success: string
  }) => Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const promptFieldId = useId()
  const [dropActive, setDropActive] = useState(false)

  function handleOpenChange(next: boolean) {
    if (!next) {
      setDropActive(false)
    }
    onOpenChange(next)
  }

  async function uploadFile(file: File) {
    if (!isAcceptableMediaFile(file) || busy) return
    await submitMediaAction({
      action: 'create-only',
      file,
      success: 'Added to library.',
    })
    handleOpenChange(false)
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[min(90vh,40rem)] w-[min(100vw-2rem,34rem)]">
        <DialogHeader>
          <DialogTitle>Add to library</DialogTitle>
          <DialogDescription>
            Upload a file, drop one into the area below, or describe what to generate. You can also drop files onto the
            gallery when this dialog is closed.
          </DialogDescription>
        </DialogHeader>

        <input
          accept="image/*,video/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void uploadFile(file)
          }}
          ref={fileInputRef}
          type="file"
        />

        <div
          className={`rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dropActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 bg-muted/20'
          }`}
          data-page-composer-no-drag="true"
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setDropActive(false)
            }
          }}
          onDragOver={(event) => {
            if (!event.dataTransfer.types.includes('Files')) return
            event.preventDefault()
            event.dataTransfer.dropEffect = 'copy'
            setDropActive(true)
          }}
          onDrop={(event) => {
            event.preventDefault()
            setDropActive(false)
            const file = event.dataTransfer.files?.[0]
            if (file) void uploadFile(file)
          }}
        >
          <p className="text-sm text-muted-foreground">Drop an image or video here, or choose a file.</p>
          <Button
            className="mt-4"
            data-page-composer-no-drag="true"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            type="button"
            variant="outline"
          >
            <UploadIcon className="mr-2 h-4 w-4" />
            Browse files
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Generate as</span>
          <select
            className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
            data-page-composer-no-drag="true"
            onChange={(event) => setMediaKind(event.target.value === 'video' ? 'video' : 'image')}
            value={mediaKind}
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="sr-only" htmlFor={promptFieldId}>
              Generation prompt
            </label>
            <Input
              className="h-10 rounded-xl"
              data-page-composer-no-drag="true"
              id={promptFieldId}
              onChange={(event) => setMediaPrompt(event.target.value)}
              placeholder="Describe the image or video to generate..."
              value={mediaPrompt}
            />
          </div>
          <Button
            data-page-composer-no-drag="true"
            disabled={busy || !mediaPrompt.trim()}
            onClick={async () => {
              await submitMediaAction({
                action: 'generate-only',
                prompt: mediaPrompt,
                success: 'Generated media added to library.',
              })
              handleOpenChange(false)
            }}
            size="sm"
            type="button"
          >
            <Wand2Icon className="mr-2 h-4 w-4" />
            Generate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
