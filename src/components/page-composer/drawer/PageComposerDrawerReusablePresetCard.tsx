'use client'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { resolveBlockLibraryCategory, type ReusablePreset } from './PageComposerDrawerBlockLibraryTypes'

export function PageComposerDrawerReusablePresetCard({
  blockLibraryMode,
  insertReusablePreset,
  preset,
}: {
  blockLibraryMode: 'insert' | 'replace'
  insertReusablePreset: (args: { key: string; mode: 'detached' | 'linked' }) => void
  preset: ReusablePreset
}) {
  return (
    <div className={adminPanelChrome.card}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-foreground">{preset.label}</div>
        <Badge variant="outline">{preset.blockType}</Badge>
        <Badge variant="outline">{resolveBlockLibraryCategory(preset.blockType)}</Badge>
        <Badge variant="secondary">reusable</Badge>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{preset.description}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => insertReusablePreset({ key: preset.key, mode: 'linked' })} size="sm" type="button" variant="outline">
          {blockLibraryMode === 'replace' ? 'Replace with linked' : 'Insert linked'}
        </Button>
        <Button onClick={() => insertReusablePreset({ key: preset.key, mode: 'detached' })} size="sm" type="button">
          {blockLibraryMode === 'replace' ? 'Replace with detached copy' : 'Insert detached copy'}
        </Button>
      </div>
    </div>
  )
}
