'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import type { PageMediaReference } from '@/lib/media/pageMediaDevtools'

export type CurrentPageMediaRegistry = {
  entries: PageMediaReference[]
  pageId: number
  pagePath: string
  pageSlug: string
  pageTitle: string
}

type PageMediaDevtoolsContextValue = {
  clearPage: (pagePath: string) => void
  currentPage: CurrentPageMediaRegistry | null
  enabled: boolean
  setCurrentPage: (page: CurrentPageMediaRegistry) => void
}

const PageMediaDevtoolsContext = createContext<null | PageMediaDevtoolsContextValue>(null)

export function PageMediaDevtoolsProvider({
  children,
  enabled = false,
}: {
  children: React.ReactNode
  enabled?: boolean
}) {
  const [currentPage, setCurrentPageState] = useState<CurrentPageMediaRegistry | null>(null)

  const setCurrentPage = useCallback((page: CurrentPageMediaRegistry) => {
    setCurrentPageState(page)
  }, [])

  const clearPage = useCallback((pagePath: string) => {
    setCurrentPageState((current) => (current?.pagePath === pagePath ? null : current))
  }, [])

  const value = useMemo(
    () => ({ clearPage, currentPage, enabled, setCurrentPage }),
    [clearPage, currentPage, enabled, setCurrentPage],
  )

  return (
    <PageMediaDevtoolsContext.Provider value={value}>{children}</PageMediaDevtoolsContext.Provider>
  )
}

export function usePageMediaDevtoolsOptional() {
  return useContext(PageMediaDevtoolsContext)
}

/** Stable key when entry *content* is unchanged (parent often passes a new array each render). */
function pageMediaEntriesSignature(entries: CurrentPageMediaRegistry['entries']): string {
  return entries
    .map(
      (e) =>
        `${e.relationPath}\x1f${e.mediaId ?? ''}\x1f${e.label}\x1f${e.media?.id ?? ''}\x1f${e.media?.updatedAt ?? ''}`,
    )
    .sort()
    .join('\x1e')
}

export function PageMediaRegistryBridge({
  entries,
  pageId,
  pagePath,
  pageSlug,
  pageTitle,
}: CurrentPageMediaRegistry) {
  const context = usePageMediaDevtoolsOptional()
  const clearPage = context?.clearPage
  const setCurrentPage = context?.setCurrentPage
  const entriesKey = pageMediaEntriesSignature(entries)
  // The parent recreates `entries` on each render; key off the content signature instead.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableEntries = useMemo(() => entries, [entriesKey])

  useEffect(() => {
    if (!clearPage || !setCurrentPage) {
      return
    }

    setCurrentPage({
      entries: stableEntries,
      pageId,
      pagePath,
      pageSlug,
      pageTitle,
    })

    return () => {
      clearPage(pagePath)
    }
  }, [clearPage, pageId, pagePath, pageSlug, pageTitle, setCurrentPage, stableEntries])

  return null
}
