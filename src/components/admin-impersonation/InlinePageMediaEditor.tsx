'use client'

import { useCallback, useMemo, useState } from 'react'
import { SparklesIcon, UploadIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { COPILOT_MEDIA_GENERATION_ENABLED } from '@/constants/copilotFeatures'
import { usePageMediaDevtoolsOptional } from '@/components/admin-impersonation/PageMediaDevtoolsContext'
import { usePageComposerCanvasToolbarState } from '@/components/page-composer/PageComposerCanvas'
import { usePortalCopilotOptional } from '@/components/copilot/PortalCopilotContext'
import { buildMediaDevtoolsSummary, type PageMediaReference } from '@/lib/media/pageMediaDevtools'
import { readPageComposerMediaDragId, readPageComposerMediaDragPayload } from '@/lib/pages/pageComposerMediaDrag'
import { Button } from '@/components/ui/button'
import type { Media } from '@/payload-types'

type InlinePageMediaEditorProps = {
  children: React.ReactNode
  relationPath: string
}

type SubmitAction = 'create-and-swap' | 'generate-and-swap' | 'replace-existing' | 'swap-existing-reference'

function getFileKind(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

function getMediaKindFromMimeType(mimeType: null | string | undefined): 'image' | 'video' {
  return mimeType?.startsWith('video/') ? 'video' : 'image'
}

function getMediaId(value: unknown): null | number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }

  if (!value || typeof value !== 'object') {
    return null
  }

  const id = Number((value as { id?: unknown }).id)
  return Number.isInteger(id) && id > 0 ? id : null
}

function getMediaSummary(value: unknown) {
  if (!value || typeof value !== 'object') {
    return null
  }

  return buildMediaDevtoolsSummary(value as Parameters<typeof buildMediaDevtoolsSummary>[0])
}

function asMediaDocument(value: unknown): Media | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Media

  if (!candidate.url && !candidate.filename && !candidate.mimeType) {
    return null
  }

  return candidate
}

export function InlinePageMediaEditor({ children, relationPath }: InlinePageMediaEditorProps) {
  const router = useRouter()
  const context = usePageMediaDevtoolsOptional()
  const toolbarState = usePageComposerCanvasToolbarState()
  const copilot = usePortalCopilotOptional()
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState<null | string>(null)
  const [, setSubmitting] = useState<null | SubmitAction>(null)
  const entry = useMemo(
    () => context?.currentPage?.entries.find((item) => item.relationPath === relationPath) || null,
    [context?.currentPage?.entries, relationPath],
  )
  const sectionIndex = useMemo(() => {
    const match = relationPath.match(/^layout\.(\d+)\./)
    return match ? Number(match[1]) : -1
  }, [relationPath])
  const sectionSummary = useMemo(
    () => toolbarState?.sectionSummaries.find((summary) => summary.index === sectionIndex) ?? null,
    [sectionIndex, toolbarState?.sectionSummaries],
  )
  const draftResolvedEntry = useMemo<null | PageMediaReference>(() => {
    if (!context?.enabled || !toolbarState?.draftPage) {
      return null
    }

    const draftPage = toolbarState.draftPage
    const pageId = Number(draftPage.id || context.currentPage?.pageId || 0)
    const pagePath = draftPage.pagePath || context.currentPage?.pagePath || '/'
    const pageSlug = draftPage.slug || context.currentPage?.pageSlug || ''
    const pageTitle = draftPage.title || context.currentPage?.pageTitle || pageSlug || 'Untitled page'

    if (relationPath === 'hero.media') {
      return {
        label: 'Hero image',
        media: getMediaSummary(draftPage.hero?.media),
        mediaId: getMediaId(draftPage.hero?.media),
        pageId,
        pagePath,
        pageSlug,
        pageTitle,
        relationPath,
      }
    }

    const layoutMediaMatch = /^layout\.(\d+)\.media$/.exec(relationPath)
    if (layoutMediaMatch) {
      const blockIndex = Number(layoutMediaMatch[1])
      const block = draftPage.layout?.[blockIndex]

      if (!block || (block.blockType !== 'mediaBlock' && block.blockType !== 'heroBlock')) {
        return null
      }

      return {
        label:
          block.blockType === 'heroBlock'
            ? 'Hero image'
            : sectionSummary?.label || block.blockName?.trim() || `Media block ${blockIndex + 1}`,
        media: getMediaSummary(block.media),
        mediaId: getMediaId(block.media),
        pageId,
        pagePath,
        pageSlug,
        pageTitle,
        relationPath,
      }
    }

    const serviceMediaMatch = /^layout\.(\d+)\.services\.(\d+)\.media$/.exec(relationPath)
    if (serviceMediaMatch) {
      const blockIndex = Number(serviceMediaMatch[1])
      const serviceIndex = Number(serviceMediaMatch[2])
      const block = draftPage.layout?.[blockIndex]

      if (!block || block.blockType !== 'serviceGrid') {
        return null
      }

      const service = block.services?.[serviceIndex]
      if (!service) {
        return null
      }

      const blockLabel = sectionSummary?.label || block.heading?.trim() || `Service section ${blockIndex + 1}`
      const rowLabel = service.name?.trim() || `Row ${serviceIndex + 1}`

      return {
        label: `${blockLabel}: ${rowLabel}`,
        media: getMediaSummary(service.media),
        mediaId: getMediaId(service.media),
        pageId,
        pagePath,
        pageSlug,
        pageTitle,
        relationPath,
      }
    }

    return null
  }, [context?.currentPage?.pageId, context?.currentPage?.pagePath, context?.currentPage?.pageSlug, context?.currentPage?.pageTitle, context?.enabled, relationPath, sectionSummary?.label, toolbarState?.draftPage])
  const resolvedEntry = useMemo<null | PageMediaReference>(() => {
    return draftResolvedEntry ?? entry ?? null
  }, [draftResolvedEntry, entry])
  const enabled = Boolean(context?.enabled && resolvedEntry)

  const handleCanvasSelection = useCallback((target: EventTarget | null) => {
    if (!resolvedEntry) {
      return
    }

    const element = target instanceof HTMLElement ? target : null
    if (element?.closest('a, button, input, textarea, select, label, [role="button"]')) {
      return
    }

    toolbarState?.onOpenMediaSlot(resolvedEntry.relationPath)
  }, [resolvedEntry, toolbarState])

  const openMediaDrawer = useCallback(() => {
    if (!resolvedEntry) {
      return
    }

    toolbarState?.onOpenMediaSlot(resolvedEntry.relationPath)
  }, [resolvedEntry, toolbarState])

  const openMediaWorkflow = useCallback((mode: 'image' | 'video') => {
    if (!resolvedEntry) {
      return
    }

    toolbarState?.onOpenMediaSlot(resolvedEntry.relationPath)

    if (!copilot) {
      return
    }

    copilot.setAuthoringContext({
      mediaSlot: {
        label: resolvedEntry.label,
        mediaId: resolvedEntry.mediaId,
        mimeType: resolvedEntry.media?.mimeType ?? null,
        relationPath: resolvedEntry.relationPath,
      },
      page: {
        id: toolbarState?.draftPage?.id ?? context?.currentPage?.pageId ?? resolvedEntry.pageId,
        pagePath: toolbarState?.draftPage?.pagePath ?? context?.currentPage?.pagePath ?? resolvedEntry.pagePath,
        slug: toolbarState?.draftPage?.slug ?? context?.currentPage?.pageSlug ?? resolvedEntry.pageSlug,
        status: toolbarState?.draftPage?._status === 'published' ? 'published' : 'draft',
        title: toolbarState?.draftPage?.title ?? context?.currentPage?.pageTitle ?? resolvedEntry.pageTitle,
        visibility: toolbarState?.draftPage?.visibility === 'private' ? 'private' : 'public',
      },
      section: sectionSummary
        ? {
            blockType: sectionSummary.blockType,
            description: sectionSummary.description,
            index: sectionSummary.index,
            label: sectionSummary.label,
            variant: sectionSummary.variant,
          }
        : null,
      surface: 'page-composer',
    })
    copilot.openFocusedMediaSession({
      mode,
      promptHint: resolvedEntry.media?.alt || resolvedEntry.label,
    })
  }, [context?.currentPage?.pageId, context?.currentPage?.pagePath, context?.currentPage?.pageSlug, context?.currentPage?.pageTitle, copilot, resolvedEntry, sectionSummary, toolbarState])

  async function submitFormData(formData: FormData, action: SubmitAction) {
    const relationPathToRefresh = resolvedEntry?.relationPath ?? null
    const currentMediaId = resolvedEntry?.mediaId ?? null
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
          ? `Updated media record ${currentMediaId ?? ''}.`
          : `Created media record ${payload?.mediaId ?? ''} and swapped the page reference.`,
      )
      if (toolbarState && relationPathToRefresh) {
        await toolbarState.onRefreshMediaSlot(relationPathToRefresh)
      }
      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to update page media.')
    } finally {
      setSubmitting(null)
    }
  }

  async function submitFile(file: File, action: 'create-and-swap' | 'replace-existing') {
    if (!resolvedEntry) {
      return
    }

    const formData = new FormData()
    formData.set('action', action)
    formData.set('alt', resolvedEntry.media?.alt || resolvedEntry.label)
    formData.set('file', file)
    formData.set('mediaKind', getFileKind(file))

    if (action === 'replace-existing') {
      if (!resolvedEntry.mediaId) {
        setStatus('This image does not have a media record to replace yet.')
        return
      }
      formData.set('mediaId', String(resolvedEntry.mediaId))
    } else {
      const pageId = Number(toolbarState?.draftPage?.id || resolvedEntry.pageId)
      if (!pageId) {
        setStatus('Save this page as a draft before assigning media.')
        return
      }
      formData.set('pageId', String(pageId))
      formData.set('relationPath', resolvedEntry.relationPath)
    }

    await submitFormData(formData, action)
  }

  async function swapFromLibraryMedia(libraryMediaId: number) {
    if (!resolvedEntry) {
      return
    }

    const relationPathToRefresh = resolvedEntry.relationPath
    const pageId = Number(toolbarState?.draftPage?.id || context?.currentPage?.pageId || resolvedEntry.pageId)
    if (!pageId) {
      setStatus('Save this page as a draft before assigning media.')
      return
    }

    setSubmitting('swap-existing-reference')
    setStatus(null)

    try {
      const formData = new FormData()
      formData.set('action', 'swap-existing-reference')
      formData.set('mediaId', String(libraryMediaId))
      formData.set('pageId', String(pageId))
      formData.set('relationPath', resolvedEntry.relationPath)
      formData.set('mediaKind', getMediaKindFromMimeType(resolvedEntry.media?.mimeType))

      const response = await fetch('/api/internal/page-composer/media', {
        body: formData,
        method: 'POST',
      })
      const payload = (await response.json().catch(() => null)) as null | { error?: string }

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to assign media.')
      }

      setStatus('Media assigned to this slot.')
      if (toolbarState) {
        await toolbarState.onRefreshMediaSlot(relationPathToRefresh)
      }
      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to assign media.')
    } finally {
      setSubmitting(null)
    }
  }

  if (!enabled || !resolvedEntry) {
    return children
  }

  return (
    <div
      data-page-composer-interactive="true"
      className={`group/page-media relative block h-full w-full ${dragActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
      onClick={(event) => {
        handleCanvasSelection(event.target)
      }}
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
        event.dataTransfer.dropEffect = 'copy'
        if (!dragActive) {
          setDragActive(true)
        }
      }}
      onDrop={async (event) => {
        event.preventDefault()
        setDragActive(false)

        const fromLibrary = readPageComposerMediaDragPayload(event.dataTransfer)
        if (fromLibrary !== null) {
          const draggedMedia = asMediaDocument(fromLibrary.media)

          if (draggedMedia && toolbarState?.onStageMediaSlot) {
            toolbarState.onStageMediaSlot(draggedMedia, resolvedEntry.relationPath)
            setStatus('Media staged for this draft. Autosave will persist it.')
            return
          }

          await swapFromLibraryMedia(fromLibrary.id ?? readPageComposerMediaDragId(event.dataTransfer) ?? 0)
          return
        }

        const file = event.dataTransfer.files?.[0]

        if (!file) {
          return
        }

        await submitFile(file, resolvedEntry.mediaId ? 'replace-existing' : 'create-and-swap')
      }}
    >
      {children}

      <div
        className={`pointer-events-none absolute inset-0 rounded-[inherit] border transition ${
          dragActive
            ? 'border-primary/60 bg-black/10'
            : 'border-primary/0 group-hover/page-media:border-primary/40 group-hover/page-media:bg-black/6'
        }`}
      />

      <div
        className={`pointer-events-none absolute inset-x-3 top-3 flex justify-between gap-2 transition ${
          dragActive ? 'opacity-100' : 'opacity-0 group-hover/page-media:opacity-100'
        }`}
      >
        <div className="rounded-full bg-black/70 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur">
          {resolvedEntry.label}
        </div>
        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          <Button
            className="h-8 rounded-full bg-background/94 px-3 text-xs shadow-lg"
            onClick={openMediaDrawer}
            size="sm"
            type="button"
            variant="secondary"
          >
            <UploadIcon className="h-3.5 w-3.5" />
            Replace
          </Button>
          {COPILOT_MEDIA_GENERATION_ENABLED ? (
            <Button
              className="h-8 rounded-full bg-background/94 px-3 text-xs shadow-lg"
              onClick={() => openMediaWorkflow(getMediaKindFromMimeType(resolvedEntry.media?.mimeType))}
              size="sm"
              type="button"
              variant="secondary"
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              Generate
            </Button>
          ) : null}
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
