'use client'

import { useMemo, useRef, useState } from 'react'
import { LoaderCircleIcon, SparklesIcon, UploadIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { usePageMediaDevtoolsOptional } from '@/components/admin-impersonation/PageMediaDevtoolsContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type InlinePageMediaEditorProps = {
  children: React.ReactNode
  relationPath: string
}

type SubmitAction = 'create-and-swap' | 'generate-and-swap' | 'replace-existing'

function buildAltFallback(prompt: string, entryLabel: string) {
  const trimmed = prompt.trim()
  return (trimmed || entryLabel).slice(0, 240)
}

function getFileKind(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

function getMediaKindFromMimeType(mimeType: null | string | undefined): 'image' | 'video' {
  return mimeType?.startsWith('video/') ? 'video' : 'image'
}

export function InlinePageMediaEditor({ children, relationPath }: InlinePageMediaEditorProps) {
  const router = useRouter()
  const context = usePageMediaDevtoolsOptional()
  const [dragActive, setDragActive] = useState(false)
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [generateKind, setGenerateKind] = useState<'image' | 'video'>('image')
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<null | string>(null)
  const [submitting, setSubmitting] = useState<null | SubmitAction>(null)
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
      const response = await fetch('/api/internal/dev/page-media', {
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
      setGeneratorOpen(false)
      setPrompt('')
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

  async function submitGenerated() {
    if (!entry) {
      return
    }

    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      setStatus(`Enter a ${generateKind} prompt first.`)
      return
    }

    const formData = new FormData()
    formData.set('action', 'generate-and-swap')
    formData.set('alt', buildAltFallback(trimmedPrompt, entry.label))
    formData.set('mediaKind', generateKind)
    formData.set('prompt', trimmedPrompt)

    if (entry.mediaId) {
      formData.set('sourceMediaId', String(entry.mediaId))
    }

    formData.set('pageId', String(entry.pageId))
    formData.set('relationPath', entry.relationPath)

    await submitFormData(formData, 'generate-and-swap')
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
              setGenerateKind(getMediaKindFromMimeType(entry.media?.mimeType))
              setGeneratorOpen((current) => !current)
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

      {generatorOpen ? (
        <div className="absolute inset-x-3 bottom-3 z-20 rounded-[1.2rem] border border-border/80 bg-background/96 p-3 shadow-2xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Generate replacement</div>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={() => setGenerateKind('image')}
              size="sm"
              type="button"
              variant={generateKind === 'image' ? 'default' : 'outline'}
            >
              Image
            </Button>
            <Button
              onClick={() => setGenerateKind('video')}
              size="sm"
              type="button"
              variant={generateKind === 'video' ? 'default' : 'outline'}
            >
              Video
            </Button>
          </div>
          <Textarea
            className="mt-3 min-h-24"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={`Describe the new ${generateKind} for ${entry.label.toLowerCase()}...`}
            value={prompt}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={submitting !== null}
              onClick={() => submitGenerated()}
              size="sm"
              type="button"
            >
              {submitting === 'generate-and-swap' ? (
                <>
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                `Generate ${generateKind}`
              )}
            </Button>
            <Button onClick={() => setGeneratorOpen(false)} size="sm" type="button" variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {status ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-full bg-background/94 px-3 py-2 text-xs text-foreground shadow-lg">
          {status}
        </div>
      ) : null}
    </div>
  )
}
