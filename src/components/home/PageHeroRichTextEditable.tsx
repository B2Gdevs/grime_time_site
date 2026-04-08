'use client'

import type { ReactNode } from 'react'

import { InlinePageMediaEditor } from '@/components/admin-impersonation/InlinePageMediaEditor'
import { InlineTextarea, usePageComposerTextGenerator } from '@/components/page-composer/PageComposerInlineText'
import { usePageComposerCanvasToolbarState } from '@/components/page-composer/PageComposerCanvas'
import { usePageComposerOptional } from '@/components/page-composer/PageComposerContext'
import { useHeroInteractable } from '@/components/copilot/CopilotInteractable'

function HeroInteractableRegistrar({
  body,
  id,
  pagePath,
  selected,
}: {
  body: string
  id: string
  pagePath: string
  selected: boolean
}) {
  useHeroInteractable({
    id,
    selected,
    state: {
      body,
      eyebrow: '',
      headlineAccent: '',
      headlinePrimary: '',
      pagePath,
      panelBody: '',
      panelEyebrow: '',
      panelHeading: '',
    },
  })

  return null
}

export function PageHeroRichTextEditable({
  body,
  children,
  className,
}: {
  body: string
  children: ReactNode
  className: string
}) {
  const composer = usePageComposerOptional()
  const toolbarState = usePageComposerCanvasToolbarState()
  const openTextGenerator = usePageComposerTextGenerator()
  const heroEditor = toolbarState?.heroEditor?.kind === 'rich-text' ? toolbarState.heroEditor : null
  const isSelected = Boolean(composer?.isOpen && heroEditor && toolbarState?.selectedIndex === heroEditor.blockIndex)

  if (!heroEditor || !isSelected) {
    return (
      <>
        {composer?.isOpen && toolbarState ? (
          <HeroInteractableRegistrar
            body={heroEditor?.copy ?? body}
            id={`hero:${toolbarState.draftPage?.id ?? 'page'}`}
            pagePath={toolbarState.draftPage?.pagePath ?? '/'}
            selected={isSelected}
          />
        ) : null}
        {children}
      </>
    )
  }

  return (
    <>
      {toolbarState ? (
        <HeroInteractableRegistrar
          body={heroEditor.copy}
          id={`hero:${toolbarState.draftPage?.id ?? 'page'}`}
          pagePath={toolbarState.draftPage?.pagePath ?? '/'}
          selected={isSelected}
        />
      ) : null}
      <InlineTextarea
        className={className}
        onChange={heroEditor.updateCopy}
        onGenerate={() =>
          openTextGenerator({
            applyText: heroEditor.updateCopy,
            currentText: heroEditor.copy,
            fieldLabel: 'hero body',
            fieldPath: heroEditor.copyFieldPath,
            instructions: 'Rewrite this page hero copy so it stays clear, page-specific, and aligned with the current route intent.',
          })}
        placeholder="Hero body copy"
        rows={5}
        value={heroEditor.copy}
      />
    </>
  )
}

export function PageHeroMediaEditable({
  children,
  relationPath,
}: {
  children: ReactNode
  relationPath?: string
}) {
  const composer = usePageComposerOptional()
  const toolbarState = usePageComposerCanvasToolbarState()
  const heroEditor = toolbarState?.heroEditor ?? null
  const resolvedRelationPath = relationPath || heroEditor?.mediaRelationPath || 'hero.media'
  const isSelected = Boolean(composer?.isOpen && heroEditor && toolbarState?.selectedIndex === heroEditor.blockIndex)

  if (!isSelected) {
    return <>{children}</>
  }

  return <InlinePageMediaEditor relationPath={resolvedRelationPath}>{children}</InlinePageMediaEditor>
}
