'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

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
  setCurrentPage: (page: CurrentPageMediaRegistry) => void
}

const PageMediaDevtoolsContext = createContext<null | PageMediaDevtoolsContextValue>(null)

export function PageMediaDevtoolsProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPageState] = useState<CurrentPageMediaRegistry | null>(null)

  const setCurrentPage = useCallback((page: CurrentPageMediaRegistry) => {
    setCurrentPageState(page)
  }, [])

  const clearPage = useCallback((pagePath: string) => {
    setCurrentPageState((current) => (current?.pagePath === pagePath ? null : current))
  }, [])

  const value = useMemo(
    () => ({ clearPage, currentPage, setCurrentPage }),
    [clearPage, currentPage, setCurrentPage],
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
  const entriesRef = useRef(entries)
  entriesRef.current = entries

  useEffect(() => {
    if (!clearPage || !setCurrentPage) {
      return
    }

    setCurrentPage({
      entries: entriesRef.current,
      pageId,
      pagePath,
      pageSlug,
      pageTitle,
    })

    return () => {
      clearPage(pagePath)
    }
  }, [clearPage, entriesKey, pageId, pagePath, pageSlug, pageTitle, setCurrentPage])

  return null
}
