'use client'

import { ImageIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { HeroBlock } from '@/payload-types'

type EditableHeroField =
  | 'eyebrow'
  | 'headlineAccent'
  | 'headlinePrimary'
  | 'panelBody'
  | 'panelEyebrow'
  | 'panelHeading'

export function PageComposerDrawerHeroEditor({
  heroBlock,
  heroCopy,
  onOpenMediaSlot,
  selectedIndex,
  updateCopy,
  updateField,
}: {
  heroBlock: HeroBlock
  heroCopy: string
  onOpenMediaSlot: (relationPath: string) => void
  selectedIndex: number
  updateCopy: (value: string) => void
  updateField: (field: EditableHeroField, value: string) => void
}) {
  const isHomepageHero = heroBlock.type === 'lowImpact'

  return (
    <div className="grid gap-4">
      <div className={adminPanelChrome.card}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">Hero media</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Manage the selected hero image from the page media slots.
            </div>
          </div>
          <Button
            onClick={() => onOpenMediaSlot(`layout.${selectedIndex}.media`)}
            size="sm"
            type="button"
            variant="secondary"
          >
            <ImageIcon className="h-4 w-4" />
            Edit media
          </Button>
        </div>
      </div>

      {isHomepageHero ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className={adminPanelChrome.fieldLabel}>Eyebrow</label>
              <Input
                onChange={(event) => updateField('eyebrow', event.target.value)}
                value={heroBlock.eyebrow || ''}
              />
            </div>
            <div className="grid gap-2">
              <label className={adminPanelChrome.fieldLabel}>Panel eyebrow</label>
              <Input
                onChange={(event) => updateField('panelEyebrow', event.target.value)}
                value={heroBlock.panelEyebrow || ''}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className={adminPanelChrome.fieldLabel}>Headline</label>
              <Input
                onChange={(event) => updateField('headlinePrimary', event.target.value)}
                value={heroBlock.headlinePrimary || ''}
              />
            </div>
            <div className="grid gap-2">
              <label className={adminPanelChrome.fieldLabel}>Headline accent</label>
              <Input
                onChange={(event) => updateField('headlineAccent', event.target.value)}
                value={heroBlock.headlineAccent || ''}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className={adminPanelChrome.fieldLabel}>Body copy</label>
            <Textarea className="min-h-28" onChange={(event) => updateCopy(event.target.value)} value={heroCopy} />
          </div>

          <div className="grid gap-2">
            <label className={adminPanelChrome.fieldLabel}>Panel heading</label>
            <Input
              onChange={(event) => updateField('panelHeading', event.target.value)}
              value={heroBlock.panelHeading || ''}
            />
          </div>

          <div className="grid gap-2">
            <label className={adminPanelChrome.fieldLabel}>Panel body</label>
            <Textarea
              className="min-h-24"
              onChange={(event) => updateField('panelBody', event.target.value)}
              value={heroBlock.panelBody || ''}
            />
          </div>
        </>
      ) : (
        <div className="grid gap-2">
          <label className={adminPanelChrome.fieldLabel}>Body copy</label>
          <Textarea className="min-h-32" onChange={(event) => updateCopy(event.target.value)} value={heroCopy} />
        </div>
      )}
    </div>
  )
}
