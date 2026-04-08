'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { blockLibraryCategoryOptions, type BlockLibraryCategory } from './PageComposerDrawerBlockLibraryTypes'

export function PageComposerDrawerBlockLibraryFilters({
  activeCategory,
  blockLibraryQuery,
  setActiveCategory,
  setBlockLibraryQuery,
}: {
  activeCategory: BlockLibraryCategory
  blockLibraryQuery: string
  setActiveCategory: (value: BlockLibraryCategory) => void
  setBlockLibraryQuery: (value: string) => void
}) {
  return (
    <div className="grid gap-3">
      <Input onChange={(event) => setBlockLibraryQuery(event.target.value)} placeholder="Search blocks" value={blockLibraryQuery} />
      <div className="flex flex-wrap gap-2">
        {blockLibraryCategoryOptions.map((option) => (
          <Button
            key={option.value}
            onClick={() => setActiveCategory(option.value)}
            size="sm"
            type="button"
            variant={activeCategory === option.value ? 'secondary' : 'outline'}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
