'use client'

import { useMemo, useRef, useState } from 'react'
import { SparklesIcon, UploadIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { usePageMediaDevtoolsOptional } from '@/components/admin-impersonation/PageMediaDevtoolsContext'
import { usePortalCopilotOptional } from '@/components/copilot/PortalCopilotContext'
import { Button } from '@/components/ui/button'

type InlinePageMediaEditorProps = {
  children: React.ReactNode
  relationPath: string
}

type SubmitAction = 'create-and-swap' | 'generate-and-swap' | 'replace-existing'

function getFileKind(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

function getMediaKindFromMimeType(mimeType: null | string | undefined): 'image' | 'video' {
  return mimeType?.startsWith('video/') ? 'video' : 'image'
}

export function InlinePageMediaEditor({ children, relationPath }: InlinePageMediaEditorProps) {
  const router = useRouter()
  const context = usePageMediaDevtoolsOptional()
  const copilot = usePortalCopilotOptional()
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState<null | string>(null)
  const [, setSubmitting] = useState<null | SubmitAction>(null)
  const replaceInputRef = useRef<HTMLInputElement | null>(null)
  const entry = useMemo(
    () => context?.currentPage?.entries.find((item) => item.relationPath === relationPath) || null,
    [context?.currentPage?.entries, relationPath],
  )
  const enabled = Boolean(context?.enabled && entry)

  async function submitFormData(formData: FormData, action: SubmitAction) {
    setSubmitting(action)
    setStatus(null)

    try {
      const response = await fetch('/api/internal/page-composer/media', {
        body: formData,
        method: 'POST',
      })
      const payload = (await response.json().catch(() => null)) as null | { error?: string; mediaId?: number }

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to update page media.')
      }

      setStatus(
        action === 'replace-existing'
          ? `Updated media record ${entry?.mediaId ?? ''}.`
          : `Created media record ${payload?.mediaId ?? ''} and swapped the page reference.`,
      )
      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to update page media.')
    } finally {
      setSubmitting(null)
    }
  }

  async function submitFile(file: File, action: 'create-and-swap' | 'replace-existing') {
    if (!entry) {
      return
    }

    const formData = new FormData()
    formData.set('action', action)
    formData.set('alt', entry.media?.alt || entry.label)
    formData.set('file', file)
    formData.set('mediaKind', getFileKind(file))

    if (action === 'replace-existing') {
      if (!entry.mediaId) {
        setStatus('This image does not have a media record to replace yet.')
        return
      }
      formData.set('mediaId', String(entry.mediaId))
    } else {
      formData.set('pageId', String(entry.pageId))
      formData.set('relationPath', entry.relationPath)
    }

    await submitFormData(formData, action)
  }

  if (!enabled || !entry) {
    return children
  }

  return (
    <div
      className={`group/page-media relative ${dragActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
      onDragEnter={(event) => {
        event.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
          return
        }
        setDragActive(false)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        if (!dragActive) {
          setDragActive(true)
        }
      }}
      onDrop={async (event) => {
        event.preventDefault()
        setDragActive(false)
        const file = event.dataTransfer.files?.[0]

        if (!file) {
          return
        }

        await submitFile(file, entry.mediaId ? 'replace-existing' : 'create-and-swap')
      }}
    >
      {children}

      <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-primary/0 transition group-hover/page-media:border-primary/40 group-hover/page-media:bg-black/6" />

      <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-between gap-2 opacity-0 transition group-hover/page-media:opacity-100">
        <div className="rounded-full bg-black/70 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur">
          {entry.label}
        </div>
        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          <input
            accept="image/*,video/*"
            className="hidden"
            ref={replaceInputRef}
            type="file"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) {
                return
              }
              await submitFile(file, entry.mediaId ? 'replace-existing' : 'create-and-swap')
              event.currentTarget.value = ''
            }}
          />
          <Button
            className="h-8 rounded-full bg-background/94 px-3 text-xs shadow-lg"
            onClick={() => replaceInputRef.current?.click()}
            size="sm"
            type="button"
            variant="secondary"
          >
            <UploadIcon className="h-3.5 w-3.5" />
            Replace
          </Button>
          <Button
            className="h-8 rounded-full bg-background/94 px-3 text-xs shadow-lg"
            onClick={() => {
              copilot?.openFocusedMediaSession({
                mode: getMediaKindFromMimeType(entry.media?.mimeType),
                promptHint: entry.media?.alt || entry.label,
              })
            }}
            size="sm"
            type="button"
            variant="secondary"
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            Generate
          </Button>
        </div>
      </div>

      {status ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-full bg-background/94 px-3 py-2 text-xs text-foreground shadow-lg">
          {status}
        </div>
      ) : null}
    </div>
  )
}
