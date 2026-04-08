'use client'
/* eslint-disable @next/next/no-img-element */

import { ImageIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { asMedia } from '@/components/page-composer/drawer/PageComposerDrawerUtils'
import { getMediaKindFromMimeType } from '@/components/page-composer/drawer/PageComposerDrawerMediaTypes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { buildMediaDevtoolsSummary } from '@/lib/media/pageMediaDevtools'
import { cn } from '@/utilities/ui'
import type { ServiceGridBlock } from '@/payload-types'

const serviceGridVariantHelpText = {
  featureCards: 'Card grid view for page-local service rows or proof-style summaries.',
  interactive: 'Selectable detail view that shows one active row at a time with a larger media panel.',
  pricingSteps: 'Step-by-step explainer treatment using the same service-row data in a pricing-style layout.',
} as const

export function PageComposerDrawerServiceGridEditor({
  mutateSelectedService,
  mutateSelectedServiceGrid,
  onOpenMediaSlot,
  selectedBlock,
  selectedLayoutIndex,
}: {
  mutateSelectedService: (
    serviceIndex: number,
    mutator: (service: NonNullable<ServiceGridBlock['services']>[number]) => NonNullable<ServiceGridBlock['services']>[number],
  ) => void
  mutateSelectedServiceGrid: (mutator: (block: ServiceGridBlock) => ServiceGridBlock) => void
  onOpenMediaSlot: (relationPath: string) => void
  selectedBlock: ServiceGridBlock
  selectedLayoutIndex: number
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className={adminPanelChrome.fieldLabel}>Block name</label>
        <Input
          onChange={(event) => mutateSelectedServiceGrid((block) => ({ ...block, blockName: event.target.value || undefined }))}
          value={selectedBlock.blockName || ''}
        />
      </div>

      <div className="grid gap-2">
        <label className={adminPanelChrome.fieldLabel}>Display variant</label>
        <select
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          onChange={(event) =>
            mutateSelectedServiceGrid((block) => ({
              ...block,
              displayVariant: event.target.value as 'featureCards' | 'interactive' | 'pricingSteps',
            }))
          }
          value={selectedBlock.displayVariant || 'interactive'}
        >
          <option value="featureCards">Card grid view</option>
          <option value="pricingSteps">Pricing step view</option>
          <option value="interactive">Interactive detail view</option>
        </select>
        <p className="text-xs leading-5 text-muted-foreground">
          Variant changes presentation only. Your row copy, media, pricing hints, and highlights stay attached to this block.
        </p>
        <p className="text-xs leading-5 text-muted-foreground">
          {serviceGridVariantHelpText[selectedBlock.displayVariant || 'interactive']}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className={adminPanelChrome.fieldLabel}>Eyebrow</label>
          <Input
            onChange={(event) => mutateSelectedServiceGrid((block) => ({ ...block, eyebrow: event.target.value }))}
            value={selectedBlock.eyebrow || ''}
          />
        </div>
        <div className="grid gap-2">
          <label className={adminPanelChrome.fieldLabel}>Heading</label>
          <Input
            onChange={(event) => mutateSelectedServiceGrid((block) => ({ ...block, heading: event.target.value }))}
            value={selectedBlock.heading || ''}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className={adminPanelChrome.fieldLabel}>Intro</label>
        <Textarea
          className="min-h-24"
          onChange={(event) => mutateSelectedServiceGrid((block) => ({ ...block, intro: event.target.value }))}
          value={selectedBlock.intro || ''}
        />
      </div>

      <div className="grid gap-3">
        {(selectedBlock.services || []).map((service, serviceIndex) => {
          const mediaSummary = buildMediaDevtoolsSummary(asMedia(service.media))
          const previewUrl = mediaSummary?.previewUrl || null
          const relationPath = `layout.${selectedLayoutIndex}.services.${serviceIndex}.media`
          const label = mediaSummary?.filename || mediaSummary?.alt || 'Row media'

          return (
            <div key={`${service.name}-${serviceIndex}`} className={adminPanelChrome.card}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-foreground">Row {serviceIndex + 1}</div>
                <Button
                  onClick={() =>
                    mutateSelectedServiceGrid((block) => {
                      const services = [...(block.services || [])]
                      services.splice(serviceIndex, 1)
                      return { ...block, services }
                    })
                  }
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2Icon className="h-4 w-4" />
                  Remove
                </Button>
              </div>

              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex w-full shrink-0 flex-col gap-2 sm:w-[7.75rem]">
                  <span className={adminPanelChrome.fieldLabel}>Media</span>
                  <div
                    className={cn(
                      'relative aspect-square w-full overflow-hidden rounded-xl border border-border/60 bg-muted/30',
                      previewUrl ? '' : 'flex items-center justify-center',
                    )}
                  >
                    {previewUrl ? (
                      getMediaKindFromMimeType(mediaSummary?.mimeType) === 'video' ? (
                        <video className="h-full w-full object-cover" muted playsInline src={previewUrl} />
                      ) : (
                        <img alt={label} className="h-full w-full object-cover" src={previewUrl} />
                      )
                    ) : (
                      <ImageIcon aria-hidden className="h-8 w-8 text-muted-foreground/80" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Button
                      onClick={() => onOpenMediaSlot(relationPath)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      {previewUrl ? 'Edit in Media tab' : 'Choose in Media tab'}
                    </Button>
                    {previewUrl ? (
                      <Button
                        onClick={() =>
                          mutateSelectedService(serviceIndex, (current) => ({
                            ...current,
                            media: null,
                          }))
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Clear media
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      onChange={(event) => mutateSelectedService(serviceIndex, (current) => ({ ...current, name: event.target.value }))}
                      placeholder="Name"
                      value={service.name || ''}
                    />
                    <Input
                      onChange={(event) => mutateSelectedService(serviceIndex, (current) => ({ ...current, eyebrow: event.target.value }))}
                      placeholder="Eyebrow"
                      value={service.eyebrow || ''}
                    />
                  </div>
                  <Textarea
                    className="min-h-20"
                    onChange={(event) => mutateSelectedService(serviceIndex, (current) => ({ ...current, summary: event.target.value }))}
                    placeholder="Summary"
                    value={service.summary || ''}
                  />
                  <Input
                    onChange={(event) => mutateSelectedService(serviceIndex, (current) => ({ ...current, pricingHint: event.target.value }))}
                    placeholder="Pricing hint"
                    value={service.pricingHint || ''}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Button
        onClick={() =>
          mutateSelectedServiceGrid((block) => ({
            ...block,
            services: [
              ...(block.services || []),
              {
                eyebrow: 'New row',
                highlights: [{ text: 'Replace this default proof point.' }],
                name: 'New item',
                pricingHint: '',
                summary: 'Describe this row.',
              },
            ],
          }))
        }
        size="sm"
        type="button"
        variant="secondary"
      >
        <PlusIcon className="h-4 w-4" />
        Add row
      </Button>
    </div>
  )
}
