'use client'

import { Badge } from '@/components/ui/badge'

import type { PageComposerBlockDefinition } from '@/lib/pages/pageComposerBlockRegistry'

import { resolveBlockLibraryCategory } from './PageComposerDrawerBlockLibraryTypes'

export function PageComposerDrawerBlockDefinitionCard({
  definition,
  insertRegisteredBlock,
}: {
  definition: PageComposerBlockDefinition
  insertRegisteredBlock: (type: PageComposerBlockDefinition['id']) => void
}) {
  return (
    <button
      className={`rounded-2xl border p-4 text-left transition ${
        definition.supportsInsert
          ? 'border-border/70 bg-card/50 hover:border-primary/40 hover:bg-primary/5'
          : 'cursor-not-allowed border-border/50 bg-card/30 opacity-65'
      }`}
      disabled={!definition.supportsInsert}
      onClick={() => (definition.supportsInsert ? insertRegisteredBlock(definition.id) : undefined)}
      type="button"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-foreground">{definition.label}</div>
        <Badge variant="outline">{definition.blockType}</Badge>
        <Badge variant="outline">{resolveBlockLibraryCategory(definition.blockType)}</Badge>
        {definition.supportsReusable ? <Badge variant="secondary">reusable-ready</Badge> : null}
        {!definition.supportsInsert ? <Badge variant="outline">planned</Badge> : null}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{definition.description}</div>
    </button>
  )
}
