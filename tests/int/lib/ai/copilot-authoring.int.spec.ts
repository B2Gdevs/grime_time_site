import { describe, expect, it } from 'vitest'

import {
  buildCopilotAuthoringSystemMessage,
  sanitizeCopilotAuthoringContext,
  sanitizeCopilotFocusedSession,
} from '@/lib/ai'

describe('copilot authoring helpers', () => {
  it('sanitizes page-composer authoring context', () => {
    expect(
      sanitizeCopilotAuthoringContext({
        mediaSlot: {
          label: 'Hero image',
          mediaId: 55,
          mimeType: 'image/png',
          relationPath: 'layout.0.services.0.media',
        },
        page: {
          id: 7,
          pagePath: '/',
          slug: 'home',
          status: 'published',
          title: 'Home',
          visibility: 'public',
        },
        section: {
          blockType: 'serviceGrid',
          description: 'featureCards • 3 rows',
          index: 1,
          label: 'What we do',
          variant: 'featureCards',
        },
        surface: 'page-composer',
      }),
    ).toEqual({
      mediaSlot: {
        label: 'Hero image',
        mediaId: 55,
        mimeType: 'image/png',
        relationPath: 'layout.0.services.0.media',
      },
      page: {
        id: 7,
        pagePath: '/',
        slug: 'home',
        status: 'published',
        title: 'Home',
        visibility: 'public',
      },
      section: {
        blockType: 'serviceGrid',
        description: 'featureCards • 3 rows',
        index: 1,
        label: 'What we do',
        variant: 'featureCards',
      },
      surface: 'page-composer',
    })
  })

  it('sanitizes focused media sessions and rejects unsupported types', () => {
    expect(
      sanitizeCopilotFocusedSession({
        mode: 'image',
        promptHint: 'Wide exterior shot',
        type: 'media-generation',
      }),
    ).toEqual({
      mode: 'image',
      promptHint: 'Wide exterior shot',
      type: 'media-generation',
    })

    expect(sanitizeCopilotFocusedSession({ type: 'something-else' })).toBeNull()
  })

  it('builds a system message with selected page, section, media slot, and focused mode', () => {
    const message = buildCopilotAuthoringSystemMessage({
      authoringContext: sanitizeCopilotAuthoringContext({
        mediaSlot: {
          label: 'Before photo',
          mediaId: 11,
          mimeType: 'image/jpeg',
          relationPath: 'layout.0.services.0.media',
        },
        page: {
          id: 9,
          pagePath: '/about',
          slug: 'about',
          status: 'draft',
          title: 'About',
          visibility: 'private',
        },
        section: {
          blockType: 'serviceGrid',
          description: 'interactive • 3 rows',
          index: 0,
          label: 'What we do',
          variant: 'interactive',
        },
        surface: 'page-composer',
      }),
      focusedSession: sanitizeCopilotFocusedSession({
        mode: 'video',
        promptHint: 'Slow reveal of the siding cleanup',
        type: 'media-generation',
      }),
    })

    expect(message).toContain('Active authoring surface: page composer')
    expect(message).toContain('Page: About (/about)')
    expect(message).toContain('Selected section: #1 What we do')
    expect(message).toContain('Selected media slot: Before photo at layout.0.services.0.media')
    expect(message).toContain('Focused generation mode: video')
  })
})
