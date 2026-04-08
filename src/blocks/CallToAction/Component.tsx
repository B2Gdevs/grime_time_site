'use client'

import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { CMSLink } from '@/components/Link'
import { InlineTextarea, InlineTextInput, usePageComposerTextGenerator } from '@/components/page-composer/PageComposerInlineText'
import { usePageComposerCanvasToolbarState } from '@/components/page-composer/PageComposerCanvas'
import { lexicalToPlainText } from '@/lib/pages/pageComposerLexical'

export const CallToActionBlock: React.FC<CTABlockProps> = ({ links, richText }) => {
  const toolbarState = usePageComposerCanvasToolbarState()
  const openTextGenerator = usePageComposerTextGenerator()
  const editor = toolbarState?.ctaEditor ?? null
  const bodyCopy = lexicalToPlainText(richText)

  return (
    <section className="container">
      <div className="site-section-shell overflow-hidden px-6 py-8 md:px-10 md:py-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-[48rem]">
            {editor ? (
              <InlineTextarea
                className="min-h-28 border-primary/30 bg-background/92 text-base leading-7"
                onChange={editor.updateCopy}
                onGenerate={() =>
                  openTextGenerator({
                    applyText: editor.updateCopy,
                    currentText: bodyCopy,
                    fieldLabel: 'cta body',
                    fieldPath: `layout.${toolbarState?.selectedIndex}.richText`,
                    instructions: 'Rewrite this call-to-action copy so it stays clear, compact, and conversion-focused.',
                  })}
                rows={4}
                value={bodyCopy}
              />
            ) : richText ? <RichText className="mb-0" data={richText} enableGutter={false} /> : null}
          </div>
          <div className="flex flex-col gap-4">
            {(links || []).map(({ link }, i) => {
              return editor ? (
                <InlineTextInput
                  key={i}
                  className="h-10 min-w-[14rem] border-primary/30 bg-background/92 text-sm font-medium"
                  onChange={(value) => editor.updateLinkLabel(i, value)}
                  onGenerate={() =>
                    openTextGenerator({
                      applyText: (value) => editor.updateLinkLabel(i, value),
                      currentText: link.label || '',
                      fieldLabel: `cta button ${i + 1}`,
                      fieldPath: `layout.${toolbarState?.selectedIndex}.links.${i}.link.label`,
                      instructions: 'Rewrite this CTA button label so it stays short, clear, and action-oriented.',
                    })}
                  placeholder="CTA label"
                  value={link.label || ''}
                />
              ) : <CMSLink key={i} size="lg" {...link} />
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
