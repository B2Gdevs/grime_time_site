import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HeroBlock } from '@/blocks/Hero/Component'
import { createLexicalParagraph } from '@/lib/pages/pageComposerLexical'

vi.mock('@/heros/RenderHero', () => ({
  RenderHero: ({ richText, type }: { richText?: unknown; type?: string }) => (
    <div>
      <span>{type}</span>
      <span>{JSON.stringify(richText)}</span>
    </div>
  ),
}))

vi.mock('@/components/page-composer/PageComposerCanvas', () => ({
  usePageComposerCanvasToolbarState: () => ({
    draftPage: {
      _status: 'draft',
      hero: { type: 'none' },
      id: 7,
      layout: [
        {
          blockType: 'heroBlock',
          richText: createLexicalParagraph('Draft medium-impact hero copy.'),
          type: 'mediumImpact',
        },
      ],
      pagePath: '/',
      publishedAt: null,
      slug: 'home',
      title: 'Home',
      updatedAt: null,
      visibility: 'public',
    },
  }),
}))

vi.mock('@/components/copilot/CopilotInteractable', () => ({
  useHeroInteractable: () => undefined,
  useLiveCanvasInteractable: () => undefined,
  useSectionInteractable: () => undefined,
}))

describe('HeroBlock draft override', () => {
  it('uses the draft hero block for live canvas rendering before publish', () => {
    render(
      <HeroBlock
        blockType="heroBlock"
        blockIndex={0}
        pagePath="/"
        richText={createLexicalParagraph('Published homepage hero copy.')}
        type="lowImpact"
      />,
    )

    expect(screen.getByText('mediumImpact')).toBeTruthy()
    expect(screen.getByText(/Draft medium-impact hero copy\./)).toBeTruthy()
    expect(screen.queryByText(/Published homepage hero copy\./)).toBeNull()
  })
})
