'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  FilePlus2Icon,
  ImageIcon,
  LoaderCircleIcon,
  PencilLineIcon,
  XIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { usePageMediaDevtoolsOptional } from '@/components/admin-impersonation/PageMediaDevtoolsContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function buildDuplicateMap(mediaIds: Array<null | number>) {
  const counts = new Map<number, number>()

  for (const mediaId of mediaIds) {
    if (mediaId == null) {
      continue
    }

    counts.set(mediaId, (counts.get(mediaId) || 0) + 1)
  }

  return counts
}

export function PageMediaDevtoolsDrawer({ enabled }: { enabled: boolean }) {
  const router = useRouter()
  const context = usePageMediaDevtoolsOptional()
  const currentPage = context?.currentPage || null
  const entries = useMemo(() => currentPage?.entries || [], [currentPage])
  const [open, setOpen] = useState(false)
  const [selectedPath, setSelectedPath] = useState<null | string>(null)
  const [status, setStatus] = useState<null | string>(null)
  const [submittingAction, setSubmittingAction] = useState<null | 'create-and-swap' | 'replace-existing'>(null)

  useEffect(() => {
    if (!entries.length) {
      setSelectedPath(null)
      return
    }

    setSelectedPath((current) =>
      current && entries.some((entry) => entry.relationPath === current) ? current : entries[0]?.relationPath || null,
    )
  }, [entries])

  const duplicates = useMemo(() => buildDuplicateMap(entries.map((entry) => entry.mediaId)), [entries])
  const selectedEntry = entries.find((entry) => entry.relationPath === selectedPath) || entries[0] || null

  async function submitAction(args: {
    action: 'create-and-swap' | 'replace-existing'
    alt?: string
    file: File
  }) {
    if (!selectedEntry) {
      setStatus('Pick a media reference first.')
      return
    }

    setSubmittingAction(args.action)
    setStatus(null)

    try {
      const formData = new FormData()
      formData.set('action', args.action)
      formData.set('file', args.file)

      if (args.alt?.trim()) {
        formData.set('alt', args.alt.trim())
      }

      if (args.action === 'replace-existing') {
        if (!selectedEntry.mediaId) {
          throw new Error('This page reference does not currently point to a media record.')
        }

        formData.set('mediaId', String(selectedEntry.mediaId))
      } else {
        formData.set('pageId', String(selectedEntry.pageId))
        formData.set('relationPath', selectedEntry.relationPath)
      }

      const response = await fetch('/api/internal/dev/page-media', {
        body: formData,
        method: 'POST',
      })

      const payload = (await response.json().catch(() => null)) as null | {
        error?: string
        mediaId?: number
      }

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to update page media.')
      }

      setStatus(
        args.action === 'replace-existing'
          ? `Updated media record ${selectedEntry.mediaId}.`
          : `Created media record ${payload?.mediaId ?? ''} and swapped the page reference.`,
      )
      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to update page media.')
    } finally {
      setSubmittingAction(null)
    }
  }

  if (!enabled) {
    return null
  }

  return (
    <>
      <Button disabled={!currentPage} onClick={() => setOpen(true)} size="sm" type="button" variant="ghost">
        <ImageIcon className="h-4 w-4" />
        Page media
        {entries.length > 0 ? <Badge variant="secondary">{entries.length}</Badge> : null}
      </Button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              aria-label="Close page media sidebar"
              className="fixed inset-0 z-[88] bg-black/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              type="button"
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-[89] flex w-[min(100vw,30rem)] flex-col border-l border-border/70 bg-background/96 shadow-2xl backdrop-blur"
              initial={{ opacity: 0, x: 64 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 64 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Local media devtools</Badge>
                    {currentPage ? <Badge variant="secondary">{currentPage.pageSlug}</Badge> : null}
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-foreground">Page media</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {currentPage
                      ? `Inspect and replace media for ${currentPage.pageTitle}.`
                      : 'No page media registry is active on this route.'}
                  </p>
                </div>
                <Button onClick={() => setOpen(false)} size="icon" type="button" variant="ghost">
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>

              {!currentPage ? (
                <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  Open a frontend page with registered media relationships to use this tool.
                </div>
              ) : (
                <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto]">
                  <div className="min-h-0 overflow-y-auto px-5 py-4" data-portal-scroll="">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        {entries.map((entry) => {
                          const active = selectedEntry?.relationPath === entry.relationPath
                          const duplicateCount = entry.mediaId ? duplicates.get(entry.mediaId) || 0 : 0

                          return (
                            <button
                              key={entry.relationPath}
                              className={`grid w-full grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-2xl border p-3 text-left transition ${
                                active
                                  ? 'border-primary/50 bg-primary/8'
                                  : 'border-border/70 bg-card/55 hover:border-border hover:bg-card/80'
                              }`}
                              onClick={() => setSelectedPath(entry.relationPath)}
                              type="button"
                            >
                              <div className="overflow-hidden rounded-xl border border-border/60 bg-muted">
                                {entry.media?.previewUrl ? (
                                  <img
                                    alt={entry.media.alt || entry.label}
                                    className="h-16 w-16 object-cover"
                                    src={entry.media.previewUrl}
                                  />
                                ) : (
                                  <div className="flex h-16 w-16 items-center justify-center text-muted-foreground">
                                    <ImageIcon className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-foreground">{entry.label}</div>
                                <div className="mt-1 truncate text-xs text-muted-foreground">{entry.relationPath}</div>
                                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                  {entry.media?.filename ? <span>{entry.media.filename}</span> : null}
                                  {entry.mediaId ? <span>ID {entry.mediaId}</span> : null}
                                  {duplicateCount > 1 ? <span>Used {duplicateCount} times</span> : null}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {selectedEntry ? (
                        <div className="rounded-[1.4rem] border border-border/70 bg-card/52 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                                Selected media
                              </div>
                              <div className="mt-1 text-sm font-semibold text-foreground">{selectedEntry.label}</div>
                            </div>
                            <Badge variant="outline">{selectedEntry.relationPath}</Badge>
                          </div>

                          <div className="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-muted">
                            {selectedEntry.media?.previewUrl ? (
                              <img
                                alt={selectedEntry.media.alt || selectedEntry.label}
                                className="aspect-[16/10] w-full object-cover"
                                src={selectedEntry.media.previewUrl}
                              />
                            ) : (
                              <div className="flex aspect-[16/10] items-center justify-center text-muted-foreground">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                            <div>Record: {selectedEntry.mediaId ? `media:${selectedEntry.mediaId}` : 'none'}</div>
                            {selectedEntry.media?.filename ? <div>Filename: {selectedEntry.media.filename}</div> : null}
                            {selectedEntry.media?.alt ? <div>Alt: {selectedEntry.media.alt}</div> : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-t border-border/70 px-5 py-4">
                    {selectedEntry ? (
                      <div className="grid gap-4">
                        <form
                          className="grid gap-3 rounded-[1.35rem] border border-border/70 bg-card/52 p-4"
                          onSubmit={async (event) => {
                            event.preventDefault()
                            const formData = new FormData(event.currentTarget)
                            const file = formData.get('file')

                            if (!(file instanceof File) || file.size === 0) {
                              setStatus('Choose a file to replace the current media.')
                              return
                            }

                            await submitAction({
                              action: 'replace-existing',
                              alt: String(formData.get('alt') || ''),
                              file,
                            })
                            event.currentTarget.reset()
                          }}
                        >
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <PencilLineIcon className="h-4 w-4 text-primary" />
                            Replace current record file
                          </div>
                          <Input accept="image/*" name="file" type="file" />
                          <Input defaultValue={selectedEntry.media?.alt || ''} name="alt" placeholder="Optional alt text override" />
                          <Button disabled={submittingAction !== null} type="submit">
                            {submittingAction === 'replace-existing' ? (
                              <>
                                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                                Updating media…
                              </>
                            ) : (
                              'Replace file in place'
                            )}
                          </Button>
                        </form>

                        <form
                          className="grid gap-3 rounded-[1.35rem] border border-border/70 bg-card/52 p-4"
                          onSubmit={async (event) => {
                            event.preventDefault()
                            const formData = new FormData(event.currentTarget)
                            const file = formData.get('file')

                            if (!(file instanceof File) || file.size === 0) {
                              setStatus('Choose a file to create a new media record.')
                              return
                            }

                            await submitAction({
                              action: 'create-and-swap',
                              alt: String(formData.get('alt') || ''),
                              file,
                            })
                            event.currentTarget.reset()
                          }}
                        >
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <FilePlus2Icon className="h-4 w-4 text-primary" />
                            Create new media record and swap this page reference
                          </div>
                          <Input accept="image/*" name="file" type="file" />
                          <Input defaultValue={selectedEntry.media?.alt || ''} name="alt" placeholder="Alt text for the new media record" />
                          <Button disabled={submittingAction !== null} type="submit" variant="outline">
                            {submittingAction === 'create-and-swap' ? (
                              <>
                                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                                Creating and swapping…
                              </>
                            ) : (
                              'Create new and swap'
                            )}
                          </Button>
                        </form>

                        {status ? <div className="text-xs text-muted-foreground">{status}</div> : null}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Select a media reference to edit it.</div>
                    )}
                  </div>
                </div>
              )}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
