'use client'

import type { Media, Testimonial, TestimonialsSectionBlock } from '@/payload-types'

import { Media as PayloadMedia } from '@/components/Media'
import RichText from '@/components/RichText'
import {
  InlineTextarea,
  InlineTextInput,
  usePageComposerTextGenerator,
} from '@/components/admin-impersonation/PageComposerInlineText'
import { usePageComposerCanvasToolbarState } from '@/components/admin-impersonation/PageComposerCanvas'
import { lexicalToPlainText } from '@/lib/pages/pageComposerLexical'

function TestimonialAvatar({
  authorName,
  photo,
}: {
  authorName: string
  photo: number | Media | null | undefined
}) {
  const media = typeof photo === 'object' && photo !== null ? photo : null

  if (!media?.url) {
    return (
      <div
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
      >
        {authorName.slice(0, 1).toUpperCase()}
      </div>
    )
  }

  return (
    <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
      <PayloadMedia alt={authorName} fill imgClassName="object-cover" resource={media} size="44px" />
    </div>
  )
}

export function TestimonialsBlockClient({
  heading,
  intro,
  items,
}: Pick<TestimonialsSectionBlock, 'heading' | 'intro'> & {
  items: Testimonial[]
}) {
  const toolbarState = usePageComposerCanvasToolbarState()
  const openTextGenerator = usePageComposerTextGenerator()
  const editor = toolbarState?.testimonialsEditor ?? null
  const introCopy = lexicalToPlainText(intro)

  if (items.length === 0) {
    return null
  }

  return (
    <section className="container my-16">
      <div className="site-section-shell px-6 py-10 md:px-10 md:py-12">
        {editor ? (
          <div className="grid gap-4">
            <InlineTextInput
              className="h-12 max-w-3xl border-primary/30 bg-background/92 text-2xl font-semibold tracking-tight md:text-3xl"
              onChange={editor.updateHeading}
              onGenerate={() =>
                openTextGenerator({
                  applyText: editor.updateHeading,
                  currentText: heading || '',
                  fieldLabel: 'testimonials heading',
                  fieldPath: `layout.${toolbarState?.selectedIndex}.heading`,
                  instructions: 'Rewrite this testimonials heading so it feels specific, credible, and matched to the proof below it.',
                })}
              placeholder="Testimonials heading"
              value={heading || ''}
            />
            <InlineTextarea
              className="min-h-28 max-w-3xl border-primary/30 bg-background/92 text-sm leading-7 text-muted-foreground"
              onChange={editor.updateIntro}
              onGenerate={() =>
                openTextGenerator({
                  applyText: editor.updateIntro,
                  currentText: introCopy,
                  fieldLabel: 'testimonials intro',
                  fieldPath: `layout.${toolbarState?.selectedIndex}.intro`,
                  instructions: 'Rewrite this testimonials intro so it sets up the customer proof clearly without overexplaining it.',
                })}
              placeholder="Testimonials intro"
              rows={4}
              value={introCopy}
            />
          </div>
        ) : (
          <>
            {heading ? (
              <h2 className="mb-4 text-2xl font-semibold tracking-tight md:text-3xl">{heading}</h2>
            ) : null}
            {intro ? (
              <div className="mb-10 max-w-3xl text-muted-foreground">
                <RichText data={intro} enableGutter={false} />
              </div>
            ) : null}
          </>
        )}
        <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <li
              className="flex flex-col rounded-2xl border border-border bg-card/80 p-5 shadow-sm"
              key={typeof item.id === 'number' ? item.id : `t-${i}`}
            >
              {item.rating ? (
                <p
                  aria-label={`${item.rating} of 5`}
                  className="mb-2 text-sm text-amber-600 dark:text-amber-500"
                >
                  {'★'.repeat(Math.min(5, Math.max(1, item.rating)))}
                  <span className="sr-only">{item.rating} of 5 stars</span>
                </p>
              ) : null}
              <blockquote className="flex-1 text-pretty text-sm leading-relaxed text-foreground">
                “{item.quote}”
              </blockquote>
              <div className="mt-4 flex items-center gap-3 border-t border-border/80 pt-4">
                <TestimonialAvatar authorName={item.authorName} photo={item.photo} />
                <div className="min-w-0">
                  <div className="font-medium leading-tight">{item.authorName}</div>
                  {item.authorDetail ? (
                    <div className="text-xs text-muted-foreground">{item.authorDetail}</div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
