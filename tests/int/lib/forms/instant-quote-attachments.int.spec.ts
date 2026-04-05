import { describe, expect, it } from 'vitest'

import {
  INSTANT_QUOTE_ATTACHMENT_MAX_FILES,
  INSTANT_QUOTE_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  validateInstantQuoteAttachmentBatch,
} from '@/lib/forms/instantQuoteAttachments'

describe('instant quote attachment contract', () => {
  it('flags too many files, wrong mime types, and oversize uploads', () => {
    const issues = validateInstantQuoteAttachmentBatch([
      { name: 'front.jpg', size: 250_000, type: 'image/jpeg' },
      { name: 'side.png', size: 250_000, type: 'image/png' },
      { name: 'driveway.webp', size: 250_000, type: 'image/webp' },
      { name: 'gate.jpg', size: 250_000, type: 'image/jpeg' },
      { name: 'roof.jpg', size: 250_000, type: 'image/jpeg' },
      { name: 'notes.pdf', size: 250_000, type: 'application/pdf' },
      {
        name: 'huge.jpg',
        size: INSTANT_QUOTE_ATTACHMENT_MAX_FILE_SIZE_BYTES + 1,
        type: 'image/jpeg',
      },
    ])

    expect(issues).toEqual(
      expect.arrayContaining([
        `Upload up to ${INSTANT_QUOTE_ATTACHMENT_MAX_FILES} images per request.`,
        'notes.pdf must be an image file.',
        'huge.jpg exceeds the 8MB limit.',
      ]),
    )
  })
})
