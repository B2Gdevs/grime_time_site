'use client'

import Link from 'next/link'
import React from 'react'

import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  DockIcon,
  DropletsIcon,
  HomeIcon,
  MountainIcon,
  RulerIcon,
  WavesIcon,
} from 'lucide-react'

import { InlinePageMediaEditor } from '@/components/admin-impersonation/InlinePageMediaEditor'
import { InlineTextarea, InlineTextInput, usePageComposerTextGenerator } from '@/components/admin-impersonation/PageComposerInlineText'
import { usePageComposerCanvasToolbarState } from '@/components/admin-impersonation/PageComposerCanvas'
import { usePageComposerOptional } from '@/components/admin-impersonation/PageComposerContext'
import { useSectionInteractable } from '@/components/copilot/CopilotInteractable'
import { BubbleBackground } from '@/components/BubbleBackground'
import { Media } from '@/components/Media'
import { Button } from '@/components/ui/button'
import type { ServiceGridBlock as ServiceGridBlockData } from '@/payload-types'

import { resolveServiceGridDisplayVariant } from './variants'

type ServiceGridRow = NonNullable<ServiceGridBlockData['services']>[number]

type ServiceGridBlockProps = ServiceGridBlockData & {
  blockIndex?: number
}

function hasMedia(
  media: ServiceGridRow['media'],
): media is Exclude<ServiceGridRow['media'], null | number | string> {
  return Boolean(media && typeof media === 'object')
}

function getRowIconKey(name: string) {
  const key = name.toLowerCase()
  if (key.includes('square footage')) return 'ruler'
  if (key.includes('condition')) return 'waves'
  if (key.includes('access') || key.includes('recurrence')) return 'dollar'
  if (key.includes('house')) return 'home'
  if (key.includes('driveway') || key.includes('flatwork')) return 'mountain'
  if (key.includes('dock') || key.includes('waterfront')) return 'dock'
  return 'droplets'
}

function ServiceGridRowIcon({ className, name }: { className?: string; name: string }) {
  const iconKey = getRowIconKey(name)

  if (iconKey === 'ruler') {
    return <RulerIcon className={className} />
  }

  if (iconKey === 'waves') {
    return <WavesIcon className={className} />
  }

  if (iconKey === 'dollar') {
    return <CircleDollarSignIcon className={className} />
  }

  if (iconKey === 'home') {
    return <HomeIcon className={className} />
  }

  if (iconKey === 'mountain') {
    return <MountainIcon className={className} />
  }

  if (iconKey === 'dock') {
    return <DockIcon className={className} />
  }

  return <DropletsIcon className={className} />
}

function useInlineServiceGridEditor(blockIndex?: number) {
  const composer = usePageComposerOptional()
  const toolbarState = usePageComposerCanvasToolbarState()
  const openFocusedTextSession = usePageComposerTextGenerator()

  const isSelected =
    typeof blockIndex === 'number' &&
    Boolean(composer?.isOpen) &&
    toolbarState?.selectedIndex === blockIndex &&
    Boolean(toolbarState?.serviceGridEditor)

  return {
    editor: isSelected ? toolbarState?.serviceGridEditor ?? null : null,
    openTextGenerator:
      composer && toolbarState?.sectionSummaries[blockIndex ?? -1]
        ? (args: {
            applyText?: (value: string) => void
            currentText?: string
            fieldLabel: string
            fieldPath: string
            instructions?: string
          }) => {
            const section = toolbarState.sectionSummaries[blockIndex ?? 0]
            openFocusedTextSession({
              ...args,
              instructions:
                args.instructions ||
                `Rewrite the selected ${args.fieldLabel.toLowerCase()} for section ${section.label} without changing the core service meaning.`,
            })
          }
        : undefined,
  }
}

function ServiceGridInteractableRegistrar({
  blockType,
  description,
  heading,
  id,
  index,
  intro,
  pagePath,
  rowLabels,
  selected,
  variant,
}: {
  blockType: string
  description: string
  heading: string
  id: string
  index: number
  intro: string
  pagePath: string
  rowLabels: string[]
  selected: boolean
  variant: string
}) {
  useSectionInteractable({
    description,
    id,
    name: 'service_grid',
    selected,
    state: {
      blockType,
      heading,
      index,
      intro,
      pagePath,
      rowLabels,
      variant,
    },
  })

  return null
}

function ServiceGridAddLaneButton({
  onClick,
}: {
  onClick: () => void
}) {
  return (
    <Button
      className="h-9 rounded-full"
      data-page-composer-interactive="true"
      onClick={onClick}
      size="sm"
      type="button"
      variant="outline"
    >
      Add lane
    </Button>
  )
}

export const ServiceGridBlock: React.FC<ServiceGridBlockProps> = ({
  blockIndex,
  displayVariant,
  eyebrow,
  heading,
  intro,
  services,
}) => {
  const composer = usePageComposerOptional()
  const toolbarState = usePageComposerCanvasToolbarState()
  const liveBlock =
    composer?.isOpen &&
    typeof blockIndex === 'number' &&
    toolbarState?.selectedIndex === blockIndex &&
    toolbarState.serviceGridEditor?.block
      ? toolbarState.serviceGridEditor.block
      : null
  const resolvedEyebrow = liveBlock?.eyebrow ?? eyebrow
  const resolvedHeading = liveBlock?.heading ?? heading
  const resolvedIntro = liveBlock?.intro ?? intro
  const resolvedServices = liveBlock?.services ?? services
  const variant = resolveServiceGridDisplayVariant({
    displayVariant: liveBlock?.displayVariant ?? displayVariant,
    heading: resolvedHeading,
  })

  if (variant === 'featureCards') {
    return (
      <>
        {composer?.isOpen && toolbarState ? (
          <ServiceGridInteractableRegistrar
            blockType="serviceGrid"
            description="A structured services or pricing explainer section on the live page canvas."
            heading={resolvedHeading || ''}
            id={`service-grid:${blockIndex ?? resolvedHeading ?? variant}`}
            index={blockIndex ?? -1}
            intro={resolvedIntro || ''}
            pagePath={toolbarState.draftPage?.pagePath ?? '/'}
            rowLabels={(resolvedServices || []).map((service) => service.name).filter(Boolean).slice(0, 6)}
            selected={typeof blockIndex === 'number' && toolbarState.selectedIndex === blockIndex}
            variant={variant}
          />
        ) : null}
        <FeatureCardsServiceGrid
          blockIndex={blockIndex}
          eyebrow={resolvedEyebrow}
          heading={resolvedHeading}
          intro={resolvedIntro}
          services={resolvedServices}
        />
      </>
    )
  }

  if (variant === 'pricingSteps') {
    return (
      <>
        {composer?.isOpen && toolbarState ? (
          <ServiceGridInteractableRegistrar
            blockType="serviceGrid"
            description="A structured services or pricing explainer section on the live page canvas."
            heading={resolvedHeading || ''}
            id={`service-grid:${blockIndex ?? resolvedHeading ?? variant}`}
            index={blockIndex ?? -1}
            intro={resolvedIntro || ''}
            pagePath={toolbarState.draftPage?.pagePath ?? '/'}
            rowLabels={(resolvedServices || []).map((service) => service.name).filter(Boolean).slice(0, 6)}
            selected={typeof blockIndex === 'number' && toolbarState.selectedIndex === blockIndex}
            variant={variant}
          />
        ) : null}
        <PricingStepsServiceGrid
          blockIndex={blockIndex}
          eyebrow={resolvedEyebrow}
          heading={resolvedHeading}
          intro={resolvedIntro}
          services={resolvedServices}
        />
      </>
    )
  }

  return (
    <>
      {composer?.isOpen && toolbarState ? (
        <ServiceGridInteractableRegistrar
          blockType="serviceGrid"
          description="A structured services or pricing explainer section on the live page canvas."
          heading={resolvedHeading || ''}
          id={`service-grid:${blockIndex ?? resolvedHeading ?? variant}`}
          index={blockIndex ?? -1}
          intro={resolvedIntro || ''}
          pagePath={toolbarState.draftPage?.pagePath ?? '/'}
          rowLabels={(resolvedServices || []).map((service) => service.name).filter(Boolean).slice(0, 6)}
          selected={typeof blockIndex === 'number' && toolbarState.selectedIndex === blockIndex}
          variant={variant}
        />
      ) : null}
      <InteractiveServiceGrid
        blockIndex={blockIndex}
        eyebrow={resolvedEyebrow}
        heading={resolvedHeading}
        intro={resolvedIntro}
        services={resolvedServices}
      />
    </>
  )
}

const InteractiveServiceGrid: React.FC<
  Pick<ServiceGridBlockProps, 'blockIndex' | 'eyebrow' | 'heading' | 'intro' | 'services'>
> = ({
  blockIndex,
  eyebrow,
  heading,
  intro,
  services,
}) => {
  const { editor, openTextGenerator } = useInlineServiceGridEditor(blockIndex)
  const currentBlock = editor?.block
  const currentEyebrow = currentBlock?.eyebrow ?? eyebrow
  const currentHeading = currentBlock?.heading ?? heading
  const currentIntro = currentBlock?.intro ?? intro
  const rows = currentBlock?.services || services || []
  const sectionId = currentHeading?.trim().toLowerCase() === 'what we do' ? 'services' : undefined
  const headingKey = currentHeading?.trim().toLowerCase() || ''
  const isPricing = headingKey === 'how our pricing works'
  const isWhatWeDo = headingKey === 'what we do'
  const [activeIndex, setActiveIndex] = React.useState(0)
  const activeRow = rows[activeIndex] || rows[0]

  React.useEffect(() => {
    setActiveIndex(0)
  }, [currentHeading, rows.length])

  if (!activeRow) return null

  return (
    <section className="container scroll-mt-24" id={sectionId}>
      <div className="site-section-shell overflow-hidden px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">
        {isWhatWeDo ? <BubbleBackground className="opacity-15 mix-blend-multiply" density={24} speed={0.75} /> : null}
        <div className="mb-7 max-w-3xl sm:mb-10">
          {editor ? (
            <InlineTextInput
              className="h-9 border-primary/30 bg-background/90 text-xs font-medium uppercase tracking-[0.24em] text-primary"
              onChange={(value) => editor.updateBlockField('eyebrow', value)}
              onGenerate={() =>
                openTextGenerator?.({
                  applyText: (value) => editor.updateBlockField('eyebrow', value),
                  currentText: currentEyebrow || '',
                  fieldLabel: 'section eyebrow',
                  fieldPath: `layout.${blockIndex}.eyebrow`,
                })}
              placeholder="Section eyebrow"
              value={currentEyebrow || ''}
            />
          ) : currentEyebrow ? (
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-primary sm:mb-3 sm:text-sm">
              {currentEyebrow}
            </p>
          ) : null}
          {editor ? (
            <InlineTextInput
              className="mb-3 h-12 border-primary/30 bg-background/90 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl"
              onChange={(value) => editor.updateBlockField('heading', value)}
              onGenerate={() =>
                openTextGenerator?.({
                  applyText: (value) => editor.updateBlockField('heading', value),
                  currentText: currentHeading || '',
                  fieldLabel: 'section heading',
                  fieldPath: `layout.${blockIndex}.heading`,
                })}
              placeholder="Section heading"
              value={currentHeading || ''}
            />
          ) : (
            <h2 className="mb-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">{currentHeading}</h2>
          )}
          {editor ? (
            <InlineTextarea
              className="min-h-24 border-primary/30 bg-background/90 text-base leading-relaxed text-muted-foreground sm:text-lg"
              onChange={(value) => editor.updateBlockField('intro', value)}
              onGenerate={() =>
                openTextGenerator?.({
                  applyText: (value) => editor.updateBlockField('intro', value),
                  currentText: currentIntro || '',
                  fieldLabel: 'section intro',
                  fieldPath: `layout.${blockIndex}.intro`,
                })}
              placeholder="Section intro"
              value={currentIntro || ''}
            />
          ) : currentIntro ? <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{currentIntro}</p> : null}
        </div>

        <div
          className={`grid gap-6 ${isPricing ? 'lg:grid-cols-[minmax(0,1fr)_18rem]' : 'lg:grid-cols-[18rem_minmax(0,1fr)]'}`}
        >
          <div className={`rounded-[1.4rem] border border-border/80 bg-background/80 p-3 ${isPricing ? 'lg:order-2' : ''}`}>
            <div className="flex items-center justify-between gap-3 px-3 pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {isPricing ? 'Select pricing step' : 'Select exterior lane'}
              </p>
              {editor ? <ServiceGridAddLaneButton onClick={editor.addServiceLane} /> : null}
            </div>
            <ul className="flex snap-x gap-2 overflow-x-auto px-1 pb-1 lg:grid lg:gap-2 lg:overflow-visible lg:px-0 lg:pb-0">
              {rows.map((row, index) => {
                const active = index === activeIndex
                return (
                  <li key={`${row.name}-${index}`} className="min-w-[12.5rem] snap-start lg:min-w-0">
                    <button
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                        active
                          ? 'border-primary/50 bg-primary/12 text-foreground'
                          : 'border-border/70 bg-background/50 text-muted-foreground hover:border-border hover:text-foreground'
                      }`}
                      data-page-composer-interactive="true"
                      onClick={() => setActiveIndex(index)}
                      type="button"
                    >
                      <div className="flex items-center gap-2">
                        <ServiceGridRowIcon className="size-3.5 shrink-0 text-primary/90" name={row.name} />
                        {row.eyebrow ? (
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/90">
                            {row.eyebrow}
                          </p>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-medium leading-snug">{row.name}</p>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className={`overflow-hidden rounded-[1.75rem] border border-border/80 bg-background/88 shadow-sm ${isPricing ? 'lg:order-1' : ''}`}>
            {(() => {
              const rowMedia = hasMedia(activeRow.media) ? activeRow.media : null
              const highlights = activeRow.highlights?.filter((item) => item?.text?.trim()) ?? []
              const hasFooter = Boolean(activeRow.pricingHint)

              return (
                <>
                  <div className="relative aspect-[4/3] overflow-hidden border-b border-border/80 bg-muted sm:aspect-[18/8]">
                    {typeof blockIndex === 'number' ? (
                      <InlinePageMediaEditor relationPath={`layout.${blockIndex}.services.${activeIndex}.media`}>
                        {rowMedia ? (
                          <>
                            <Media fill imgClassName="object-cover" priority resource={rowMedia} />
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,13,25,0.08)_0%,rgba(7,13,25,0.74)_100%)]" />
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(86,175,255,0.22),transparent_50%),linear-gradient(180deg,rgba(242,247,255,0.9)_0%,rgba(232,240,249,0.6)_100%)]" />
                        )}
                      </InlinePageMediaEditor>
                    ) : rowMedia ? (
                      <>
                        <Media fill imgClassName="object-cover" priority resource={rowMedia} />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,13,25,0.08)_0%,rgba(7,13,25,0.74)_100%)]" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(86,175,255,0.22),transparent_50%),linear-gradient(180deg,rgba(242,247,255,0.9)_0%,rgba(232,240,249,0.6)_100%)]" />
                    )}

                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="flex items-center gap-2">
                        <ServiceGridRowIcon className="size-4 shrink-0 text-white/80" name={activeRow.name} />
                        {editor ? (
                          <div className="min-w-[14rem]">
                            <InlineTextInput
                              className="h-8 border-white/20 bg-black/40 text-[11px] font-semibold uppercase tracking-[0.22em] text-white placeholder:text-white/60"
                              onChange={(value) => editor.updateServiceField('eyebrow', activeIndex, value)}
                              onGenerate={() =>
                                openTextGenerator?.({
                                  applyText: (value) => editor.updateServiceField('eyebrow', activeIndex, value),
                                  currentText: activeRow.eyebrow || '',
                                  fieldLabel: 'row eyebrow',
                                  fieldPath: `layout.${blockIndex}.services.${activeIndex}.eyebrow`,
                                })}
                              placeholder="Row eyebrow"
                              value={activeRow.eyebrow || ''}
                            />
                          </div>
                        ) : activeRow.eyebrow ? (
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                            {activeRow.eyebrow}
                          </p>
                        ) : null}
                      </div>
                      {editor ? (
                        <InlineTextInput
                          className="mt-2 h-11 border-white/20 bg-black/40 text-xl font-semibold tracking-tight text-white placeholder:text-white/60 sm:text-2xl"
                          onChange={(value) => editor.updateServiceField('name', activeIndex, value)}
                          onGenerate={() =>
                            openTextGenerator?.({
                              applyText: (value) => editor.updateServiceField('name', activeIndex, value),
                              currentText: activeRow.name || '',
                              fieldLabel: 'row title',
                              fieldPath: `layout.${blockIndex}.services.${activeIndex}.name`,
                            })}
                          placeholder="Row name"
                          value={activeRow.name || ''}
                        />
                      ) : (
                        <h3 className="mt-2 text-xl font-semibold tracking-tight text-balance sm:text-2xl">
                          {activeRow.name}
                        </h3>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 p-4 sm:gap-5 sm:p-5">
                    {editor ? (
                      <InlineTextarea
                        className="min-h-24 border-primary/30 bg-background/90 text-sm leading-6 text-muted-foreground sm:leading-7"
                        onChange={(value) => editor.updateServiceField('summary', activeIndex, value)}
                        onGenerate={() =>
                          openTextGenerator?.({
                            applyText: (value) => editor.updateServiceField('summary', activeIndex, value),
                            currentText: activeRow.summary || '',
                            fieldLabel: 'row summary',
                            fieldPath: `layout.${blockIndex}.services.${activeIndex}.summary`,
                          })}
                        placeholder="Row summary"
                        value={activeRow.summary || ''}
                      />
                    ) : (
                      <p className="text-sm leading-6 text-muted-foreground sm:leading-7">{activeRow.summary}</p>
                    )}

                    {highlights.length > 0 ? (
                      <ul className="grid gap-3">
                        {highlights.map((item, highlightIndex) => (
                          <li key={`${activeRow.name}-highlight-${highlightIndex}`} className="flex gap-3 text-sm">
                            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                            {editor ? (
                              <InlineTextarea
                                className="min-h-16 border-primary/30 bg-background/90 text-sm leading-6 text-foreground/90"
                                onChange={(value) => editor.updateHighlightText(highlightIndex, activeIndex, value)}
                                onGenerate={() =>
                                  openTextGenerator?.({
                                    applyText: (value) => editor.updateHighlightText(highlightIndex, activeIndex, value),
                                    currentText: item.text || '',
                                    fieldLabel: 'highlight',
                                    fieldPath: `layout.${blockIndex}.services.${activeIndex}.highlights.${highlightIndex}.text`,
                                  })}
                                placeholder="Highlight"
                                rows={2}
                                value={item.text || ''}
                              />
                            ) : (
                              <span className="leading-6 text-foreground/90">{item.text}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {hasFooter ? (
                      <div className="flex flex-col items-start gap-3 rounded-2xl border border-border/80 bg-muted/35 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
                            Priced around
                          </p>
                          {editor ? (
                            <div className="mt-1">
                              <InlineTextInput
                                className="h-9 border-primary/30 bg-background/90 text-sm text-foreground/90"
                                onChange={(value) => editor.updateServiceField('pricingHint', activeIndex, value)}
                                onGenerate={() =>
                                  openTextGenerator?.({
                                    applyText: (value) => editor.updateServiceField('pricingHint', activeIndex, value),
                                    currentText: activeRow.pricingHint || '',
                                    fieldLabel: 'pricing hint',
                                    fieldPath: `layout.${blockIndex}.services.${activeIndex}.pricingHint`,
                                  })}
                                placeholder="Pricing hint"
                                value={activeRow.pricingHint || ''}
                              />
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-foreground/90">{activeRow.pricingHint}</p>
                          )}
                        </div>
                        <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                          <Link href="/#instant-quote">
                            Estimate
                            <ArrowRightIcon className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </section>
  )
}

const FeatureCardsServiceGrid: React.FC<
  Pick<ServiceGridBlockProps, 'blockIndex' | 'eyebrow' | 'heading' | 'intro' | 'services'>
> = ({
  blockIndex,
  eyebrow,
  heading,
  intro,
  services,
}) => {
  const { editor, openTextGenerator } = useInlineServiceGridEditor(blockIndex)
  const currentBlock = editor?.block
  const currentEyebrow = currentBlock?.eyebrow ?? eyebrow
  const currentHeading = currentBlock?.heading ?? heading
  const currentIntro = currentBlock?.intro ?? intro
  const rows = currentBlock?.services || services || []

  if (!rows.length) {
    return null
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20" id="services">
      <div className="max-w-3xl">
        {editor ? (
          <div className="mb-4">
            <ServiceGridAddLaneButton onClick={editor.addServiceLane} />
          </div>
        ) : null}
        {editor ? (
          <InlineTextInput
            className="h-9 border-primary/30 bg-background/90 text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-primary"
            onChange={(value) => editor.updateBlockField('eyebrow', value)}
            onGenerate={() =>
                openTextGenerator?.({
                  applyText: (value) => editor.updateBlockField('eyebrow', value),
                  currentText: currentEyebrow || '',
                  fieldLabel: 'section eyebrow',
                  fieldPath: `layout.${blockIndex}.eyebrow`,
                })}
            placeholder="Section eyebrow"
            value={currentEyebrow || ''}
          />
        ) : (
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-primary/80">
            {currentEyebrow || 'Featured services'}
          </p>
        )}
        {editor ? (
          <InlineTextInput
            className="mt-4 h-14 border-primary/30 bg-background/90 text-4xl font-semibold tracking-tight text-foreground md:text-5xl"
            onChange={(value) => editor.updateBlockField('heading', value)}
            onGenerate={() =>
                openTextGenerator?.({
                  applyText: (value) => editor.updateBlockField('heading', value),
                  currentText: currentHeading || '',
                  fieldLabel: 'section heading',
                  fieldPath: `layout.${blockIndex}.heading`,
                })}
            placeholder="Section heading"
            value={currentHeading || ''}
          />
        ) : (
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{currentHeading}</h2>
        )}
        {editor ? (
          <InlineTextarea
            className="mt-4 min-h-24 max-w-2xl border-primary/30 bg-background/90 text-lg leading-8 text-muted-foreground"
            onChange={(value) => editor.updateBlockField('intro', value)}
            onGenerate={() =>
                openTextGenerator?.({
                  applyText: (value) => editor.updateBlockField('intro', value),
                  currentText: currentIntro || '',
                  fieldLabel: 'section intro',
                  fieldPath: `layout.${blockIndex}.intro`,
                })}
            placeholder="Section intro"
            value={currentIntro || ''}
          />
        ) : currentIntro ? <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{currentIntro}</p> : null}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {rows.map((service, serviceIndex) => {
          const media = hasMedia(service.media) ? service.media : null
          const relationPath =
            typeof blockIndex === 'number' ? `layout.${blockIndex}.services.${serviceIndex}.media` : null

          return (
            <article
              key={service.id || service.name}
              className="overflow-hidden rounded-[1.9rem] border border-border/70 bg-card/82 shadow-[0_18px_80px_-52px_rgba(2,6,23,0.85)]"
            >
              <div className="relative">
                {relationPath ? (
                  <InlinePageMediaEditor relationPath={relationPath}>
                    {media ? (
                      <Media imgClassName="aspect-[16/10] w-full object-cover" resource={media} />
                    ) : (
                      <div className="flex aspect-[16/10] w-full items-center justify-center bg-[linear-gradient(180deg,rgba(7,19,33,0.88),rgba(17,49,77,0.72))] px-3 text-center">
                        <span className="text-xs font-medium text-white/70">Drop media from the library</span>
                      </div>
                    )}
                  </InlinePageMediaEditor>
                ) : media ? (
                  <Media imgClassName="aspect-[16/10] w-full object-cover" resource={media} />
                ) : (
                  <div className="aspect-[16/10] w-full bg-[linear-gradient(180deg,rgba(7,19,33,0.88),rgba(17,49,77,0.72))]" />
                )}
                <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
                  {service.eyebrow ? (
                    editor ? (
                      <div className="w-[12rem]">
                        <InlineTextInput
                          className="h-8 rounded-full border-white/20 bg-black/40 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white placeholder:text-white/60"
                          onChange={(value) => editor.updateServiceField('eyebrow', serviceIndex, value)}
                          onGenerate={() =>
                            openTextGenerator?.({
                              applyText: (value) => editor.updateServiceField('eyebrow', serviceIndex, value),
                              currentText: service.eyebrow || '',
                              fieldLabel: 'card eyebrow',
                              fieldPath: `layout.${blockIndex}.services.${serviceIndex}.eyebrow`,
                            })}
                          placeholder="Card eyebrow"
                          value={service.eyebrow || ''}
                        />
                      </div>
                    ) : (
                      <span className="rounded-full bg-black/55 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                        {service.eyebrow}
                      </span>
                    )
                  ) : (
                    <span />
                  )}
                  {editor ? (
                    <div className="w-[10rem]">
                      <InlineTextInput
                        className="h-8 rounded-full border-white/20 bg-black/40 text-[0.68rem] font-medium text-white placeholder:text-white/60"
                        onChange={(value) => editor.updateServiceField('pricingHint', serviceIndex, value)}
                        onGenerate={() =>
                          openTextGenerator?.({
                            applyText: (value) => editor.updateServiceField('pricingHint', serviceIndex, value),
                            currentText: service.pricingHint || '',
                            fieldLabel: 'card pricing hint',
                            fieldPath: `layout.${blockIndex}.services.${serviceIndex}.pricingHint`,
                          })}
                        placeholder="Pricing hint"
                        value={service.pricingHint || ''}
                      />
                    </div>
                  ) : service.pricingHint ? (
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.68rem] font-medium text-white backdrop-blur">
                      {service.pricingHint}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="p-6">
                {editor ? (
                  <InlineTextInput
                    className="h-12 border-primary/30 bg-background/90 text-2xl font-semibold tracking-tight text-foreground"
                    onChange={(value) => editor.updateServiceField('name', serviceIndex, value)}
                    onGenerate={() =>
                      openTextGenerator?.({
                        applyText: (value) => editor.updateServiceField('name', serviceIndex, value),
                        currentText: service.name || '',
                        fieldLabel: 'card title',
                        fieldPath: `layout.${blockIndex}.services.${serviceIndex}.name`,
                      })}
                    placeholder="Card title"
                    value={service.name || ''}
                  />
                ) : (
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground">{service.name}</h3>
                )}
                {editor ? (
                  <InlineTextarea
                    className="mt-3 min-h-24 border-primary/30 bg-background/90 text-sm leading-7 text-muted-foreground"
                    onChange={(value) => editor.updateServiceField('summary', serviceIndex, value)}
                    onGenerate={() =>
                      openTextGenerator?.({
                        applyText: (value) => editor.updateServiceField('summary', serviceIndex, value),
                        currentText: service.summary || '',
                        fieldLabel: 'card summary',
                        fieldPath: `layout.${blockIndex}.services.${serviceIndex}.summary`,
                      })}
                    placeholder="Card summary"
                    value={service.summary || ''}
                  />
                ) : (
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{service.summary}</p>
                )}

                {service.highlights?.length ? (
                  <ul className="mt-5 grid gap-3">
                    {service.highlights.map((highlight, highlightIndex) => (
                      <li
                        key={highlight.id || highlight.text}
                        className="flex items-start gap-3 text-sm leading-6 text-foreground/86"
                      >
                        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                        {editor ? (
                          <InlineTextarea
                            className="min-h-16 border-primary/30 bg-background/90 text-sm leading-6 text-foreground/86"
                            onChange={(value) => editor.updateHighlightText(highlightIndex, serviceIndex, value)}
                            onGenerate={() =>
                              openTextGenerator?.({
                                applyText: (value) => editor.updateHighlightText(highlightIndex, serviceIndex, value),
                                currentText: highlight.text || '',
                                fieldLabel: 'card highlight',
                                fieldPath: `layout.${blockIndex}.services.${serviceIndex}.highlights.${highlightIndex}.text`,
                              })}
                            rows={2}
                            value={highlight.text || ''}
                          />
                        ) : (
                          <span>{highlight.text}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

const PricingStepsServiceGrid: React.FC<
  Pick<ServiceGridBlockProps, 'blockIndex' | 'eyebrow' | 'heading' | 'intro' | 'services'>
> = ({
  blockIndex,
  eyebrow,
  heading,
  intro,
  services,
}) => {
  const { editor, openTextGenerator } = useInlineServiceGridEditor(blockIndex)
  const currentBlock = editor?.block
  const currentEyebrow = currentBlock?.eyebrow ?? eyebrow
  const currentHeading = currentBlock?.heading ?? heading
  const currentIntro = currentBlock?.intro ?? intro
  const rows = (currentBlock?.services || services)?.slice(0, 3) || []

  if (!rows.length) {
    return null
  }

  return (
    <section className="border-y border-border/70 bg-card/42" id="pricing">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            {editor ? (
              <div className="mb-4">
                <ServiceGridAddLaneButton onClick={editor.addServiceLane} />
              </div>
            ) : null}
            {editor ? (
              <InlineTextInput
                className="h-9 border-primary/30 bg-background/90 text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-primary"
                onChange={(value) => editor.updateBlockField('eyebrow', value)}
                onGenerate={() =>
                    openTextGenerator?.({
                      applyText: (value) => editor.updateBlockField('eyebrow', value),
                      currentText: currentEyebrow || '',
                      fieldLabel: 'section eyebrow',
                      fieldPath: `layout.${blockIndex}.eyebrow`,
                  })}
                placeholder="Section eyebrow"
                value={currentEyebrow || ''}
              />
            ) : (
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-primary/80">
                {currentEyebrow || 'Estimate logic'}
              </p>
            )}
            {editor ? (
              <InlineTextInput
                className="mt-4 h-14 border-primary/30 bg-background/90 text-4xl font-semibold tracking-tight text-foreground md:text-5xl"
                onChange={(value) => editor.updateBlockField('heading', value)}
                onGenerate={() =>
                    openTextGenerator?.({
                      applyText: (value) => editor.updateBlockField('heading', value),
                      currentText: currentHeading || '',
                      fieldLabel: 'section heading',
                      fieldPath: `layout.${blockIndex}.heading`,
                  })}
                placeholder="Section heading"
                value={currentHeading || ''}
              />
            ) : (
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{currentHeading}</h2>
            )}
            {editor ? (
              <InlineTextarea
                className="mt-4 min-h-24 max-w-2xl border-primary/30 bg-background/90 text-lg leading-8 text-muted-foreground"
                onChange={(value) => editor.updateBlockField('intro', value)}
                onGenerate={() =>
                    openTextGenerator?.({
                      applyText: (value) => editor.updateBlockField('intro', value),
                      currentText: currentIntro || '',
                      fieldLabel: 'section intro',
                      fieldPath: `layout.${blockIndex}.intro`,
                  })}
                placeholder="Section intro"
                value={currentIntro || ''}
              />
            ) : currentIntro ? <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{currentIntro}</p> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {rows.map((step, stepIndex) => (
              <div
                key={step.id || step.name}
                className="rounded-[1.7rem] border border-border/70 bg-background/88 p-5 shadow-[0_18px_70px_-54px_rgba(2,6,23,0.82)]"
              >
                {editor ? (
                  <InlineTextInput
                    className="h-8 border-primary/30 bg-background/90 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary"
                    onChange={(value) => editor.updateServiceField('eyebrow', stepIndex, value)}
                    onGenerate={() =>
                      openTextGenerator?.({
                        applyText: (value) => editor.updateServiceField('eyebrow', stepIndex, value),
                        currentText: step.eyebrow || '',
                        fieldLabel: 'step eyebrow',
                        fieldPath: `layout.${blockIndex}.services.${stepIndex}.eyebrow`,
                      })}
                    placeholder="Step label"
                    value={step.eyebrow || ''}
                  />
                ) : step.eyebrow ? (
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary/80">
                    {step.eyebrow}
                  </p>
                ) : null}
                {editor ? (
                  <InlineTextInput
                    className="mt-3 h-10 border-primary/30 bg-background/90 text-xl font-semibold text-foreground"
                    onChange={(value) => editor.updateServiceField('name', stepIndex, value)}
                    onGenerate={() =>
                      openTextGenerator?.({
                        applyText: (value) => editor.updateServiceField('name', stepIndex, value),
                        currentText: step.name || '',
                        fieldLabel: 'step title',
                        fieldPath: `layout.${blockIndex}.services.${stepIndex}.name`,
                      })}
                    placeholder="Step title"
                    value={step.name || ''}
                  />
                ) : (
                  <h3 className="mt-3 text-xl font-semibold text-foreground">{step.name}</h3>
                )}
                {editor ? (
                  <InlineTextarea
                    className="mt-3 min-h-24 border-primary/30 bg-background/90 text-sm leading-6 text-muted-foreground"
                    onChange={(value) => editor.updateServiceField('summary', stepIndex, value)}
                    onGenerate={() =>
                      openTextGenerator?.({
                        applyText: (value) => editor.updateServiceField('summary', stepIndex, value),
                        currentText: step.summary || '',
                        fieldLabel: 'step summary',
                        fieldPath: `layout.${blockIndex}.services.${stepIndex}.summary`,
                      })}
                    placeholder="Step summary"
                    value={step.summary || ''}
                  />
                ) : (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.summary}</p>
                )}
                {editor ? (
                  <div className="mt-4">
                    <InlineTextarea
                      className="min-h-16 border-primary/30 bg-background/90 text-sm font-medium leading-6 text-foreground/80"
                      onChange={(value) => editor.updateHighlightText(0, stepIndex, value)}
                      onGenerate={() =>
                        openTextGenerator?.({
                          applyText: (value) => editor.updateHighlightText(0, stepIndex, value),
                          currentText: step.highlights?.[0]?.text || '',
                          fieldLabel: 'step highlight',
                          fieldPath: `layout.${blockIndex}.services.${stepIndex}.highlights.0.text`,
                        })}
                      rows={2}
                      value={step.highlights?.[0]?.text || ''}
                    />
                  </div>
                ) : step.highlights?.[0]?.text ? (
                  <p className="mt-4 text-sm font-medium leading-6 text-foreground/80">{step.highlights[0].text}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
