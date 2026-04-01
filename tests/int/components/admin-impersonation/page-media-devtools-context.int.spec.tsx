import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import {
  PageMediaDevtoolsProvider,
  PageMediaRegistryBridge,
  usePageMediaDevtoolsOptional,
} from '@/components/admin-impersonation/PageMediaDevtoolsContext'
import type { PageMediaReference } from '@/lib/media/pageMediaDevtools'

function Probe() {
  const context = usePageMediaDevtoolsOptional()

  return <div data-testid="page-path">{context?.currentPage?.pagePath ?? 'empty'}</div>
}

const entries: PageMediaReference[] = [
  {
    label: 'Hero',
    media: null,
    mediaId: 11,
    pageId: 7,
    pagePath: '/',
    pageSlug: 'home',
    pageTitle: 'Home',
    relationPath: 'hero.media',
  },
]

describe('page media devtools context', () => {
  afterEach(() => {
    cleanup()
  })

  it('tracks the current page without entering an update loop and clears on unmount', () => {
    const { rerender } = render(
      <PageMediaDevtoolsProvider>
        <PageMediaRegistryBridge
          entries={entries}
          pageId={7}
          pagePath="/"
          pageSlug="home"
          pageTitle="Home"
        />
        <Probe />
      </PageMediaDevtoolsProvider>,
    )

    expect(screen.getByTestId('page-path').textContent).toBe('/')

    rerender(
      <PageMediaDevtoolsProvider>
        <Probe />
      </PageMediaDevtoolsProvider>,
    )

    expect(screen.getByTestId('page-path').textContent).toBe('empty')
  })

  it('does not thrash when entries is a new array with the same media signature', () => {
    render(
      <PageMediaDevtoolsProvider>
        <PageMediaRegistryBridge
          entries={[...entries]}
          pageId={7}
          pagePath="/"
          pageSlug="home"
          pageTitle="Home"
        />
        <Probe />
      </PageMediaDevtoolsProvider>,
    )

    expect(screen.getByTestId('page-path').textContent).toBe('/')
  })
})
