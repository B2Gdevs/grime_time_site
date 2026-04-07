'use client'

import React from 'react'
import { CopyPlusIcon, EyeIcon, EyeOffIcon, PlusIcon, SmartphoneIcon, TabletSmartphoneIcon, Trash2Icon, UnplugIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { sanitizeCustomHtml } from '@/lib/pages/customHtml'
import { createLexicalParagraph, lexicalToPlainText } from '@/lib/pages/pageComposerLexical'
import { buildPageComposerSectionSummaries, type PageComposerDocument } from '@/lib/pages/pageComposer'
import {
  isLinkedReusableBlock,
  isLinkedSharedSectionBlock,
  resolvePageComposerReusableBlock,
} from '@/lib/pages/pageComposerReusableBlocks'
import type { SharedSectionRecord } from '@/lib/pages/sharedSections'
import type { Page } from '@/payload-types'

export type PageComposerLayoutBlock = Page['layout'][number]
type LayoutBlock = PageComposerLayoutBlock
type ContentBlock = Extract<LayoutBlock, { blockType: 'content' }>
type PricingTableBlock = Extract<LayoutBlock, { blockType: 'pricingTable' }>
type ServiceGridBlock = Extract<LayoutBlock, { blockType: 'serviceGrid' }>

export type PageComposerPreviewMode = 'desktop' | 'mobile' | 'tablet'

type Props = {
  onAddAbove: (index: number) => void
  onAddBelow: (index: number) => void
  onDetachReusable: (index: number) => void
  onDuplicate: (index: number) => void
  onRemove: (index: number) => void
  onPreviewModeChange: (mode: PageComposerPreviewMode) => void
  onSelect: (index: number) => void
  onToggleHidden: (index: number) => void
  onUpdateBlock: (index: number, block: LayoutBlock) => void
  page: PageComposerDocument | null
  previewMode: PageComposerPreviewMode
  selectedIndex: number
  sharedSectionsById?: Map<number, Pick<SharedSectionRecord, 'currentVersion' | 'id' | 'name' | 'structure'>>
}

function frameClassName(mode: PageComposerPreviewMode): string {
  if (mode === 'mobile') {
    return 'mx-auto max-w-[26rem]'
  }

  if (mode === 'tablet') {
    return 'mx-auto max-w-[48rem]'
  }

  return 'mx-auto max-w-none'
}

function PreviewModeToggle({
  mode,
  onChange,
}: {
  mode: PageComposerPreviewMode
  onChange: (value: PageComposerPreviewMode) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => onChange('desktop')} size="sm" type="button" variant={mode === 'desktop' ? 'default' : 'outline'}>
        Desktop
      </Button>
      <Button onClick={() => onChange('tablet')} size="sm" type="button" variant={mode === 'tablet' ? 'default' : 'outline'}>
        <TabletSmartphoneIcon className="h-4 w-4" />
        Tablet
      </Button>
      <Button onClick={() => onChange('mobile')} size="sm" type="button" variant={mode === 'mobile' ? 'default' : 'outline'}>
        <SmartphoneIcon className="h-4 w-4" />
        Mobile
      </Button>
    </div>
  )
}

function PreviewShell({
  children,
  mode,
  onModeChange,
}: {
  children: React.ReactNode
  mode: PageComposerPreviewMode
  onModeChange: (value: PageComposerPreviewMode) => void
}) {
  return (
    <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/70 bg-card/60 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Preview</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Click blocks here or on the live page. Selected blocks stay mirrored across both surfaces.
          </div>
        </div>
        <PreviewModeToggle mode={mode} onChange={onModeChange} />
      </div>

      <div className="min-h-0 overflow-y-auto rounded-[2rem] border border-border/70 bg-muted/30 p-4">
        <div className={frameClassName(mode)}>{children}</div>
      </div>
    </div>
  )
}

function BlockChrome({
  children,
  hidden,
  inlineEditor,
  isLinked,
  isLinkedSharedSection,
  label,
  onAddAbove,
  onAddBelow,
  onDetach,
  onDuplicate,
  onRemove,
  onSelect,
  onToggleHidden,
  selected,
}: {
  children: React.ReactNode
  hidden: boolean
  inlineEditor?: React.ReactNode
  isLinked: boolean
  isLinkedSharedSection?: boolean
  label: string
  onAddAbove: () => void
  onAddBelow: () => void
  onDetach: () => void
  onDuplicate: () => void
  onRemove: () => void
  onSelect: () => void
  onToggleHidden: () => void
  selected: boolean
}) {
  return (
    <section
      className={`group relative rounded-[1.75rem] border bg-background/95 p-4 shadow-sm transition ${
        selected ? 'border-primary/60 ring-2 ring-primary/15' : 'border-border/70 hover:border-primary/30'
      } ${hidden ? 'opacity-70' : ''}`}
      data-preview-selected={selected ? 'true' : 'false'}
    >
      <div className="absolute right-3 top-3 z-10 flex flex-wrap gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        <Button aria-label={`Add block above ${label}`} onClick={onAddAbove} size="icon" type="button" variant="ghost">
          <PlusIcon className="h-4 w-4" />
        </Button>
        <Button aria-label={`Add block below ${label}`} onClick={onAddBelow} size="icon" type="button" variant="ghost">
          <PlusIcon className="h-4 w-4 rotate-180" />
        </Button>
        <Button aria-label={`Duplicate ${label}`} onClick={onDuplicate} size="icon" type="button" variant="ghost">
          <CopyPlusIcon className="h-4 w-4" />
        </Button>
        <Button aria-label={`${hidden ? 'Show' : 'Hide'} ${label}`} onClick={onToggleHidden} size="icon" type="button" variant="ghost">
          {hidden ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
        </Button>
        <Button aria-label={`Delete ${label}`} onClick={onRemove} size="icon" type="button" variant="ghost">
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </div>

      <button className="w-full text-left" onClick={onSelect} type="button">
        {children}
      </button>

      {selected ? (
        <div className="mt-4 grid gap-3">
          {isLinked ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 px-3 py-3 text-sm text-foreground">
              {isLinkedSharedSection
                ? 'This block is using a linked shared section source. Open the source editor or detach a local copy before editing content here.'
                : 'This block is using a linked preset. Detach it before editing the preset content locally.'}
              <div className="mt-2">
                <Button onClick={onDetach} size="sm" type="button" variant="outline">
                  <UnplugIcon className="h-4 w-4" />
                  Detach copy
                </Button>
              </div>
            </div>
          ) : null}
          {inlineEditor}
        </div>
      ) : null}
    </section>
  )
}

function ServiceGridPreview({
  block,
  onChange,
}: {
  block: ServiceGridBlock
  onChange: (block: ServiceGridBlock) => void
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-2 md:grid-cols-2">
        <Input onChange={(event) => onChange({ ...block, eyebrow: event.target.value })} placeholder="Eyebrow" value={block.eyebrow || ''} />
        <Input onChange={(event) => onChange({ ...block, heading: event.target.value })} placeholder="Heading" value={block.heading || ''} />
      </div>
      <Textarea className="min-h-20" onChange={(event) => onChange({ ...block, intro: event.target.value })} placeholder="Intro" value={block.intro || ''} />
      <div className="grid gap-3">
        {(block.services || []).map((service, serviceIndex) => (
          <div className="rounded-2xl border border-border/70 bg-card/60 p-3" key={`${service.name}-${serviceIndex}`}>
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                onChange={(event) => {
                  const next = [...(block.services || [])]
                  next[serviceIndex] = { ...service, name: event.target.value }
                  onChange({ ...block, services: next })
                }}
                placeholder="Row name"
                value={service.name || ''}
              />
              <Input
                onChange={(event) => {
                  const next = [...(block.services || [])]
                  next[serviceIndex] = { ...service, eyebrow: event.target.value }
                  onChange({ ...block, services: next })
                }}
                placeholder="Row eyebrow"
                value={service.eyebrow || ''}
              />
            </div>
            <Textarea
              className="mt-2 min-h-20"
              onChange={(event) => {
                const next = [...(block.services || [])]
                next[serviceIndex] = { ...service, summary: event.target.value }
                onChange({ ...block, services: next })
              }}
              placeholder="Summary"
              value={service.summary || ''}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function ContentSlotEditor({
  block,
  onChange,
}: {
  block: ContentBlock
  onChange: (block: ContentBlock) => void
}) {
  return (
    <div className="grid gap-3">
      {(block.columns || []).map((column, columnIndex) => (
        <div className="rounded-2xl border border-border/70 bg-card/60 p-3" key={`slot-${columnIndex}`}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-foreground">Slot {columnIndex + 1}</div>
            <Button
              disabled={(block.columns || []).length <= 1}
              onClick={() => {
                const next = [...(block.columns || [])]
                next.splice(columnIndex, 1)
                onChange({ ...block, columns: next })
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Trash2Icon className="h-4 w-4" />
              Remove
            </Button>
          </div>
          <div className="grid gap-2 md:grid-cols-[10rem_minmax(0,1fr)]">
            <Select
              onValueChange={(value) => {
                const next = [...(block.columns || [])]
                next[columnIndex] = { ...column, size: value as NonNullable<typeof column.size> }
                onChange({ ...block, columns: next })
              }}
              value={column.size || 'full'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Slot width" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="half">Half</SelectItem>
                <SelectItem value="oneThird">One third</SelectItem>
                <SelectItem value="twoThirds">Two thirds</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              className="min-h-20"
              onChange={(event) => {
                const next = [...(block.columns || [])]
                next[columnIndex] = { ...column, richText: createLexicalParagraph(event.target.value) }
                onChange({ ...block, columns: next })
              }}
              placeholder="Slot copy"
              value={lexicalToPlainText(column.richText || null)}
            />
          </div>
        </div>
      ))}
      <Button
        onClick={() =>
          onChange({
            ...block,
            columns: [...(block.columns || []), { richText: createLexicalParagraph('New slot copy.'), size: 'half' }],
          })
        }
        size="sm"
        type="button"
        variant="secondary"
      >
        <PlusIcon className="h-4 w-4" />
        Add slot
      </Button>
    </div>
  )
}

function PricingTableEditor({
  block,
  onChange,
}: {
  block: PricingTableBlock
  onChange: (block: PricingTableBlock) => void
}) {
  return (
    <div className="grid gap-3">
      <Input onChange={(event) => onChange({ ...block, heading: event.target.value })} placeholder="Heading" value={block.heading || ''} />
      <Select onValueChange={(value) => onChange({ ...block, dataSource: value as PricingTableBlock['dataSource'] })} value={block.dataSource || 'global'}>
        <SelectTrigger>
          <SelectValue placeholder="Pricing source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="global">Global plans</SelectItem>
          <SelectItem value="inline">Inline plans</SelectItem>
        </SelectContent>
      </Select>

      {block.dataSource === 'inline' ? (
        <div className="grid gap-3">
          {(block.inlinePlans || []).map((plan, planIndex) => (
            <div className="rounded-2xl border border-border/70 bg-card/60 p-3" key={`${plan.name}-${planIndex}`}>
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  onChange={(event) => {
                    const next = [...(block.inlinePlans || [])]
                    next[planIndex] = { ...plan, name: event.target.value }
                    onChange({ ...block, inlinePlans: next })
                  }}
                  placeholder="Plan name"
                  value={plan.name || ''}
                />
                <Input
                  onChange={(event) => {
                    const next = [...(block.inlinePlans || [])]
                    next[planIndex] = { ...plan, price: event.target.value }
                    onChange({ ...block, inlinePlans: next })
                  }}
                  placeholder="Price"
                  value={plan.price || ''}
                />
              </div>
            </div>
          ))}
          <Button
            onClick={() =>
              onChange({
                ...block,
                inlinePlans: [
                  ...(block.inlinePlans || []),
                  {
                    features: [],
                    link: {
                      appearance: 'default',
                      label: 'Get started',
                      newTab: false,
                      type: 'custom',
                      url: '/contact',
                    },
                    name: 'New plan',
                    price: '$0',
                  },
                ],
              })
            }
            size="sm"
            type="button"
            variant="secondary"
          >
            <PlusIcon className="h-4 w-4" />
            Add plan
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function renderSummary(block: LayoutBlock, summaryLabel: string) {
  if (block.blockType === 'serviceGrid') {
    return (
      <div className="grid gap-4">
        <div>
          {block.eyebrow ? <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">{block.eyebrow}</div> : null}
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{block.heading}</h3>
          {block.intro ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{block.intro}</p> : null}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {(block.services || []).map((service, index) => (
            <div className="rounded-2xl border border-border/70 bg-card/60 p-3" key={`${service.name}-${index}`}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">{service.eyebrow || `Row ${index + 1}`}</div>
              <div className="mt-2 text-sm font-semibold text-foreground">{service.name}</div>
              <div className="mt-2 text-sm text-muted-foreground">{service.summary}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (block.blockType === 'content') {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {(block.columns || []).map((column, index) => (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/60 p-3" key={`content-slot-${index}`}>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
              Slot {index + 1} · {column.size || 'full'}
            </div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">
              {lexicalToPlainText(column.richText || null) || 'Empty slot'}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (block.blockType === 'cta') {
    return (
      <div className="grid gap-3">
        <div className="text-sm text-muted-foreground">
          {lexicalToPlainText(block.richText || null) || 'CTA copy'}
        </div>
        <div className="flex flex-wrap gap-2">
          {(block.links || []).map(({ link }, index) => (
            <div className="rounded-full border border-border/70 px-3 py-1 text-sm" key={`${link.label}-${index}`}>
              {link.label}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (block.blockType === 'pricingTable') {
    return (
      <div className="grid gap-3">
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">{block.heading || 'Pricing & packages'}</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{block.dataSource === 'inline' ? 'Inline plans' : 'Global pricing source'}</Badge>
          {block.dataSource === 'inline' ? <Badge variant="secondary">{block.inlinePlans?.length || 0} plans</Badge> : null}
        </div>
      </div>
    )
  }

  if (block.blockType === 'customHtml') {
    const safeHtml = sanitizeCustomHtml(block.html)

    return (
      <div className="grid gap-3">
        <div className="text-sm font-semibold text-foreground">{block.label || summaryLabel}</div>
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/60 p-3 text-sm text-muted-foreground">
          {safeHtml ? <div dangerouslySetInnerHTML={{ __html: safeHtml }} /> : 'Custom HTML will render here after sanitization.'}
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      <div className="text-lg font-semibold text-foreground">{summaryLabel}</div>
      <div className="text-sm text-muted-foreground">
        {block.blockType === 'contactRequest'
          ? 'Representative preview of the first-party contact intake block.'
          : block.blockType === 'testimonialsBlock'
            ? 'Representative preview of a testimonial feed section.'
            : block.blockType === 'archive'
              ? 'Representative preview of an archive or selected-post feed.'
                : block.blockType === 'formBlock'
                  ? 'Representative preview of a Payload form block.'
                  : block.blockType === 'mediaBlock'
                    ? 'Representative preview of a single media section.'
                    : 'Representative preview of this block type.'}
      </div>
    </div>
  )
}

function renderInlineEditor(block: LayoutBlock, onUpdate: (block: LayoutBlock) => void) {
  if (block.blockType === 'serviceGrid') {
    return <ServiceGridPreview block={block} onChange={onUpdate} />
  }

  if (block.blockType === 'content') {
    return <ContentSlotEditor block={block} onChange={onUpdate} />
  }

  if (block.blockType === 'pricingTable') {
    return <PricingTableEditor block={block} onChange={onUpdate} />
  }

  if (block.blockType === 'cta') {
    return (
      <div className="grid gap-3">
        <Textarea
          className="min-h-20"
          onChange={(event) => onUpdate({ ...block, richText: createLexicalParagraph(event.target.value) })}
          placeholder="CTA copy"
          value={lexicalToPlainText(block.richText || null)}
        />
        {(block.links || []).map(({ link }, linkIndex) => (
          <Input
            key={`${link.label}-${linkIndex}`}
            onChange={(event) => {
              const nextLinks = [...(block.links || [])]
              nextLinks[linkIndex] = { link: { ...link, label: event.target.value } }
              onUpdate({ ...block, links: nextLinks })
            }}
            placeholder={`CTA label ${linkIndex + 1}`}
            value={link.label || ''}
          />
        ))}
      </div>
    )
  }

  if (block.blockType === 'customHtml') {
    return (
      <div className="grid gap-3">
        <Input onChange={(event) => onUpdate({ ...block, label: event.target.value })} placeholder="Block label" value={block.label || ''} />
        <Textarea className="min-h-32 font-mono text-xs" onChange={(event) => onUpdate({ ...block, html: event.target.value })} placeholder="<div>Trusted embed or HTML snippet</div>" value={block.html || ''} />
      </div>
    )
  }

  return null
}

export function PageComposerBlockSummary({
  block,
  label,
}: {
  block: LayoutBlock
  label: string
}) {
  return <>{renderSummary(block, label)}</>
}

export function PageComposerInlineEditor({
  block,
  onUpdate,
}: {
  block: LayoutBlock
  onUpdate: (block: LayoutBlock) => void
}) {
  return <>{renderInlineEditor(block, onUpdate)}</>
}

export function PageComposerPreview({
  onAddAbove,
  onAddBelow,
  onDetachReusable,
  onDuplicate,
  onPreviewModeChange,
  onRemove,
  onSelect,
  onToggleHidden,
  onUpdateBlock,
  page,
  previewMode,
  selectedIndex,
  sharedSectionsById,
}: Props) {
  const summaries = React.useMemo(
    () => buildPageComposerSectionSummaries(page?.layout, sharedSectionsById),
    [page?.layout, sharedSectionsById],
  )

  if (!page) {
    return (
      <PreviewShell mode={previewMode} onModeChange={onPreviewModeChange}>
        <div className="rounded-[1.75rem] border border-dashed border-border/70 bg-background/80 px-4 py-12 text-center text-sm text-muted-foreground">
          Load a page to start previewing the composer canvas.
        </div>
      </PreviewShell>
    )
  }

  return (
    <PreviewShell mode={previewMode} onModeChange={onPreviewModeChange}>
      <div className="grid gap-4">
        {(page.layout || []).map((block, index) => {
          const summary = summaries[index]
          const resolvedBlock = resolvePageComposerReusableBlock(block, { sharedSectionsById })
          const selected = selectedIndex === index
          const isLinked = isLinkedReusableBlock(block)
          const isLinkedSharedSection = isLinkedSharedSectionBlock(block)
          const label = summary?.label || `${block.blockType} block ${index + 1}`

          return (
            <BlockChrome
              hidden={Boolean(block.isHidden)}
              inlineEditor={selected ? renderInlineEditor(resolvedBlock, (nextBlock) => onUpdateBlock(index, nextBlock)) : null}
              isLinked={isLinked}
              isLinkedSharedSection={isLinkedSharedSection}
              key={`${block.blockType}-${index}`}
              label={label}
              onAddAbove={() => onAddAbove(index)}
              onAddBelow={() => onAddBelow(index)}
              onDetach={() => onDetachReusable(index)}
              onDuplicate={() => onDuplicate(index)}
              onRemove={() => onRemove(index)}
              onSelect={() => onSelect(index)}
              onToggleHidden={() => onToggleHidden(index)}
              selected={selected}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{block.blockType}</Badge>
                {summary?.variant ? <Badge variant="secondary">{summary.variant}</Badge> : null}
                {summary?.badges?.includes('reusable') ? (
                  <Badge variant="secondary">
                    {isLinked
                      ? isLinkedSharedSection
                        ? 'linked shared section'
                        : 'linked preset'
                      : 'detached copy'}
                  </Badge>
                ) : null}
                {block.isHidden ? <Badge variant="outline">hidden</Badge> : null}
              </div>
              {renderSummary(resolvedBlock, label)}
            </BlockChrome>
          )
        })}
      </div>
    </PreviewShell>
  )
}
