import type { Payload, Where } from 'payload'

import type { User } from '@/payload-types'
import type { InboundMediaIngestionProvider, InboundMediaIngestionStatus } from '@/lib/media/inboundMediaIngestion'

type InboundMediaIngestionAttachmentDoc = {
  accepted?: boolean | null
  filename?: null | string
  linkedMediaID?: null | number | string
}

type InboundMediaIngestionDoc = {
  attachmentAudit?: InboundMediaIngestionAttachmentDoc[] | null
  createdMediaIDs?: null | Array<number | string>
  id: number | string
  ingestionLabel: string
  provider: InboundMediaIngestionProvider
  receivedAt?: null | string
  replayCount?: null | number
  senderEmail?: null | string
  status: InboundMediaIngestionStatus
  subject?: null | string
  notes?: null | string
}

export type InboundMediaIngestionWorkspaceItem = {
  acceptedAttachmentCount: number
  createdMediaCount: number
  id: string
  ingestionLabel: string
  provider: InboundMediaIngestionProvider
  receivedAt: null | string
  replayCount: number
  senderEmail: null | string
  status: InboundMediaIngestionStatus
  subject: null | string
  totalAttachmentCount: number
}

export class InboundMediaIngestionError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'InboundMediaIngestionError'
    this.status = status
  }
}

function normalizeText(value: null | string | undefined): null | string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function resolveRelatedCount(value: InboundMediaIngestionDoc['createdMediaIDs']) {
  return Array.isArray(value) ? value.length : 0
}

function mapWorkspaceItem(doc: InboundMediaIngestionDoc): InboundMediaIngestionWorkspaceItem {
  const attachments = Array.isArray(doc.attachmentAudit) ? doc.attachmentAudit : []

  return {
    acceptedAttachmentCount: attachments.filter((attachment) => attachment?.accepted === true).length,
    createdMediaCount: resolveRelatedCount(doc.createdMediaIDs),
    id: String(doc.id),
    ingestionLabel: doc.ingestionLabel,
    provider: doc.provider,
    receivedAt: doc.receivedAt ?? null,
    replayCount: typeof doc.replayCount === 'number' ? doc.replayCount : 0,
    senderEmail: normalizeText(doc.senderEmail),
    status: doc.status,
    subject: normalizeText(doc.subject),
    totalAttachmentCount: attachments.length,
  }
}

function buildWhereClause(args: {
  searchQuery?: string
  status?: InboundMediaIngestionStatus
}): undefined | Where {
  const clauses: Where[] = []

  if (args.status) {
    clauses.push({
      status: {
        equals: args.status,
      },
    })
  }

  if (args.searchQuery) {
    clauses.push({
      or: [
        {
          ingestionLabel: {
            like: args.searchQuery,
          },
        },
        {
          senderEmail: {
            like: args.searchQuery,
          },
        },
        {
          subject: {
            like: args.searchQuery,
          },
        },
      ],
    })
  }

  if (clauses.length === 0) {
    return undefined
  }

  if (clauses.length === 1) {
    return clauses[0]
  }

  return { and: clauses } as Where
}

export async function loadInboundMediaIngestionWorkspace(args: {
  payload: Payload
  searchQuery?: string
  status?: InboundMediaIngestionStatus
  user: User
}) {
  const result = await args.payload.find({
    collection: 'inbound-media-ingestions',
    depth: 1,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: '-receivedAt',
    user: args.user,
    where: buildWhereClause({
      searchQuery: normalizeText(args.searchQuery) ?? undefined,
      status: args.status,
    }),
  })

  return result.docs.map((doc) => mapWorkspaceItem(doc as InboundMediaIngestionDoc))
}

export async function requestInboundMediaReplay(args: {
  id: number
  notes?: string
  payload: Payload
  user: User
}) {
  const existing = (await args.payload
    .findByID({
      collection: 'inbound-media-ingestions',
      depth: 0,
      id: args.id,
      overrideAccess: false,
      user: args.user,
    })
    .catch(() => null)) as InboundMediaIngestionDoc | null

  if (!existing) {
    throw new InboundMediaIngestionError('Inbound media ingestion not found.', 404)
  }

  const note = normalizeText(args.notes)
  const combinedNotes = [normalizeText(existing.notes), note].filter(Boolean).join('\n\n')

  const updated = await args.payload.update({
    collection: 'inbound-media-ingestions',
    id: args.id,
    data: {
      notes: combinedNotes || undefined,
      replayCount: (typeof existing.replayCount === 'number' ? existing.replayCount : 0) + 1,
      replayRequestedAt: new Date().toISOString(),
      status: 'replay_requested',
    },
    overrideAccess: false,
    user: args.user,
  })

  return mapWorkspaceItem(updated as InboundMediaIngestionDoc)
}
