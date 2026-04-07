'use client'

import { GridIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { ServiceGridBlock } from '@/payload-types'

export function PageComposerDrawerServiceGridEditor({
  mutateSelectedService,
  mutateSelectedServiceGrid,
  selectedBlock,
}: {
  mutateSelectedService: (serviceIndex: number, mutator: (service: NonNullable<ServiceGridBlock['services']>[number]) => NonNullable<ServiceGridBlock['services']>[number]) => void
  mutateSelectedServiceGrid: (mutator: (block: ServiceGridBlock) => ServiceGridBlock) => void
  selectedBlock: ServiceGridBlock
}) {
  return (
    <div className="grid gap-4">
      <div className={adminPanelChrome.card}>
        <div className="flex flex-wrap items-center gap-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" type="button" variant="outline">
                  <GridIcon className="h-4 w-4" />
                  Find a new block
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Find a new block for the section</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid gap-2">
        <label className={adminPanelChrome.fieldLabel}>Block name</label>
        <Input onChange={(event) => mutateSelectedServiceGrid((block) => ({ ...block, blockName: event.target.value || undefined }))} value={selectedBlock.blockName || ''} />
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
          <option value="featureCards">Feature cards</option>
          <option value="pricingSteps">Pricing steps</option>
          <option value="interactive">Interactive detail</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className={adminPanelChrome.fieldLabel}>Eyebrow</label>
          <Input onChange={(event) => mutateSelectedServiceGrid((block) => ({ ...block, eyebrow: event.target.value }))} value={selectedBlock.eyebrow || ''} />
        </div>
        <div className="grid gap-2">
          <label className={adminPanelChrome.fieldLabel}>Heading</label>
          <Input onChange={(event) => mutateSelectedServiceGrid((block) => ({ ...block, heading: event.target.value }))} value={selectedBlock.heading || ''} />
        </div>
      </div>

      <div className="grid gap-2">
        <label className={adminPanelChrome.fieldLabel}>Intro</label>
        <Textarea className="min-h-24" onChange={(event) => mutateSelectedServiceGrid((block) => ({ ...block, intro: event.target.value }))} value={selectedBlock.intro || ''} />
      </div>

      <div className="grid gap-3">
        {(selectedBlock.services || []).map((service, serviceIndex) => (
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

            <div className="mt-3 grid gap-3 md:grid-cols-2">
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

            <div className="mt-3 grid gap-3">
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
        ))}
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
