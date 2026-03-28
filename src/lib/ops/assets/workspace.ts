import type { Payload } from 'payload'

import type { OpsAssetLadderItem, User } from '@/payload-types'
import type { OpsAssetLadderRow } from '@/lib/ops/opsDashboardTypes'

export type OpsAssetInput = {
  buyNotes?: null | string
  label: string
  owned?: boolean
  sortOrder?: null | number
  whyNotes?: null | string
}

function mapAssetDoc(doc: OpsAssetLadderItem): OpsAssetLadderRow {
  return {
    buyNotes: doc.buyNotes ?? null,
    id: String(doc.id),
    label: doc.label,
    owned: typeof doc.owned === 'boolean' ? doc.owned : null,
    sortOrder: typeof doc.sortOrder === 'number' ? doc.sortOrder : null,
    whyNotes: doc.whyNotes ?? null,
  }
}

function normalizeText(value: null | string | undefined): null | string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function buildAssetData(input: OpsAssetInput) {
  return {
    buyNotes: normalizeText(input.buyNotes),
    label: input.label.trim(),
    owned: input.owned ?? false,
    sortOrder: typeof input.sortOrder === 'number' ? input.sortOrder : 0,
    whyNotes: normalizeText(input.whyNotes),
  }
}

export async function loadOpsAssetsWorkspace(args: { payload: Payload; user: User }): Promise<OpsAssetLadderRow[]> {
  const result = await args.payload.find({
    collection: 'ops-asset-ladder-items',
    depth: 0,
    limit: 200,
    overrideAccess: false,
    sort: 'sortOrder',
    user: args.user,
  })

  return result.docs.map((doc) => mapAssetDoc(doc as OpsAssetLadderItem))
}

export async function createOpsAsset(args: {
  data: OpsAssetInput
  payload: Payload
  user: User
}): Promise<OpsAssetLadderRow> {
  const created = await args.payload.create({
    collection: 'ops-asset-ladder-items',
    data: buildAssetData(args.data),
    overrideAccess: false,
    user: args.user,
  })

  return mapAssetDoc(created as OpsAssetLadderItem)
}

export async function updateOpsAsset(args: {
  data: OpsAssetInput
  id: number
  payload: Payload
  user: User
}): Promise<OpsAssetLadderRow> {
  const updated = await args.payload.update({
    collection: 'ops-asset-ladder-items',
    data: buildAssetData(args.data),
    id: args.id,
    overrideAccess: false,
    user: args.user,
  })

  return mapAssetDoc(updated as OpsAssetLadderItem)
}

export async function deleteOpsAsset(args: { id: number; payload: Payload; user: User }): Promise<void> {
  await args.payload.delete({
    collection: 'ops-asset-ladder-items',
    id: args.id,
    overrideAccess: false,
    user: args.user,
  })
}
