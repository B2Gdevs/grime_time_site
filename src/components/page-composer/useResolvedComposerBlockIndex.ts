'use client'

import { useMemo } from 'react'

import { usePageComposerCanvasToolbarState } from '@/components/page-composer/PageComposerCanvas'
import { usePageComposerOptional } from '@/components/page-composer/PageComposerContext'

export function useResolvedComposerBlockIndex(args: {
  blockIndex?: number
  sectionIdentity?: string
}) {
  const composer = usePageComposerOptional()
  const toolbarState = usePageComposerCanvasToolbarState()

  const resolvedBlockIndex = useMemo(() => {
    if (!composer?.isOpen || !toolbarState || !args.sectionIdentity) {
      return args.blockIndex
    }

    const summary = toolbarState.sectionSummaries.find((item) => item.identity === args.sectionIdentity)
    return typeof summary?.index === 'number' ? summary.index : args.blockIndex
  }, [args.blockIndex, args.sectionIdentity, composer?.isOpen, toolbarState])

  return {
    composer,
    resolvedBlockIndex,
    toolbarState,
  }
}
