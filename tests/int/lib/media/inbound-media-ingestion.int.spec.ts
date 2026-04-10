import { describe, expect, it } from 'vitest'

import {
  buildInboundMediaAttachmentAudit,
  buildInboundMediaIngestionIdempotencyKey,
  buildInboundMediaIngestionLabel,
  INBOUND_MEDIA_INGESTION_MAX_ATTACHMENTS,
  INBOUND_MEDIA_INGESTION_MAX_FILE_SIZE_BYTES,
  normalizeInboundMediaEmailAddress,
  validateInboundMediaAttachmentBatch,
} from '@/lib/media/inboundMediaIngestion'

describe('inbound media ingestion contract', () => {
  it('normalizes sender addresses and prefers provider event ids for idempotency', () => {
    expect(normalizeInboundMediaEmailAddress(' Ops@Example.com ')).toBe('ops@example.com')

    expect(
      buildInboundMediaIngestionIdempotencyKey({
        provider: 'resend',
        providerEventID: ' evt_123 ',
        providerMessageID: 'msg_123',
      }),
    ).toBe('resend:event:evt_123')
  })

  it('falls back to message metadata when no provider event id exists', () => {
    expect(
      buildInboundMediaIngestionIdempotencyKey({
        provider: 'other',
        receivedAt: '2026-04-10T12:00:00.000Z',
        recipientEmail: 'intake@grimetime.app',
        senderEmail: 'crew@example.com',
      }),
    ).toBe('other:fallback:crew@example.com:intake@grimetime.app:2026-04-10T12:00:00.000Z')
  })

  it('builds a human-readable label from sender and subject', () => {
    expect(
      buildInboundMediaIngestionLabel({
        provider: 'resend',
        senderEmail: 'crew@example.com',
        subject: 'Front gate photos',
      }),
    ).toBe('Resend inbound media from crew@example.com: Front gate photos')
  })

  it('flags too many attachments, unsupported mime types, and oversized files', () => {
    const issues = validateInboundMediaAttachmentBatch([
      ...Array.from({ length: INBOUND_MEDIA_INGESTION_MAX_ATTACHMENTS }, (_, index) => ({
        contentType: 'image/jpeg',
        filename: `photo-${index}.jpg`,
        sizeBytes: 120_000,
      })),
      {
        contentType: 'application/pdf',
        filename: 'notes.pdf',
        sizeBytes: INBOUND_MEDIA_INGESTION_MAX_FILE_SIZE_BYTES + 1,
      },
    ])

    expect(issues).toEqual(
      expect.arrayContaining([
        `Accept up to ${INBOUND_MEDIA_INGESTION_MAX_ATTACHMENTS} attachments per inbound delivery.`,
        'notes.pdf must be an image or video file.',
        'notes.pdf exceeds the 25MB limit.',
      ]),
    )
  })

  it('builds attachment-level audit rows for future ingestion records', () => {
    const audit = buildInboundMediaAttachmentAudit({
      attachments: [
        {
          contentType: 'image/jpeg',
          filename: 'front.jpg',
          providerAttachmentID: 'att_1',
          sizeBytes: 40_000,
        },
        {
          contentType: 'application/pdf',
          filename: 'scope.pdf',
          sizeBytes: 40_000,
        },
      ],
    })

    expect(audit).toEqual([
      {
        accepted: true,
        contentType: 'image/jpeg',
        filename: 'front.jpg',
        issues: [],
        providerAttachmentID: 'att_1',
        sizeBytes: 40_000,
      },
      {
        accepted: false,
        contentType: 'application/pdf',
        filename: 'scope.pdf',
        issues: ['Unsupported attachment type.'],
        providerAttachmentID: null,
        sizeBytes: 40_000,
      },
    ])
  })
})

