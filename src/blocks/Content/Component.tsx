'use client'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

import type { ContentBlock as ContentBlockProps } from '@/payload-types'

import { InlineTextarea, InlineTextInput, usePageComposerTextGenerator } from '@/components/page-composer/PageComposerInlineText'
import { usePageComposerCanvasToolbarState } from '@/components/page-composer/PageComposerCanvas'
import { CMSLink } from '../../components/Link'
import { lexicalToPlainText } from '@/lib/pages/pageComposerLexical'

export const ContentBlock: React.FC<ContentBlockProps> = (props) => {
  const { columns } = props
  const isSingleFullColumn = columns?.length === 1 && columns[0]?.size === 'full'
  const toolbarState = usePageComposerCanvasToolbarState()
  const openTextGenerator = usePageComposerTextGenerator()
  const editor = toolbarState?.contentBlockEditor ?? null

  const colsSpanClasses = {
    full: '12',
    half: '6',
    oneThird: '4',
    twoThirds: '8',
  }

  return (
    <section className="container my-16">
      <div className="site-section-shell px-6 py-8 md:px-10 md:py-10">
        <div
          className={cn('grid grid-cols-4 gap-x-16 gap-y-8 lg:grid-cols-12', {
            'mx-auto max-w-4xl': isSingleFullColumn,
          })}
        >
          {columns &&
            columns.length > 0 &&
            columns.map((col, index) => {
              const { enableLink, link, richText, size } = col
              const bodyCopy = lexicalToPlainText(richText)

              return (
                <div
                  className={cn(`col-span-4 lg:col-span-${colsSpanClasses[size!]}`, {
                    'md:col-span-2': size !== 'full',
                  })}
                  key={index}
                >
                  {editor ? (
                    <InlineTextarea
                      className="min-h-28 border-primary/30 bg-background/92 text-sm leading-7"
                      onChange={(value) => editor.updateColumnCopy(index, value)}
                      onGenerate={() =>
                        openTextGenerator({
                          applyText: (value) => editor.updateColumnCopy(index, value),
                          currentText: bodyCopy,
                          fieldLabel: `content column ${index + 1}`,
                          fieldPath: `layout.${toolbarState?.selectedIndex}.columns.${index}.richText`,
                          instructions: 'Rewrite this content column so it stays specific, readable, and aligned with the surrounding section.',
                        })}
                      rows={5}
                      value={bodyCopy}
                    />
                  ) : richText ? <RichText data={richText} enableGutter={false} /> : null}

                  {enableLink && link ? (
                    editor ? (
                      <div className="mt-4">
                        <InlineTextInput
                          className="h-10 border-primary/30 bg-background/92 text-sm font-medium"
                          onChange={(value) => editor.updateColumnLinkLabel(index, value)}
                          onGenerate={() =>
                            openTextGenerator({
                              applyText: (value) => editor.updateColumnLinkLabel(index, value),
                              currentText: link.label || '',
                              fieldLabel: `content link ${index + 1}`,
                              fieldPath: `layout.${toolbarState?.selectedIndex}.columns.${index}.link.label`,
                              instructions: 'Rewrite this content link label so it stays short and action-oriented.',
                            })}
                          placeholder="Link label"
                          value={link.label || ''}
                        />
                      </div>
                    ) : (
                      <CMSLink {...link} />
                    )
                  ) : null}
                </div>
              )
            })}
        </div>
      </div>
    </section>
  )
}
