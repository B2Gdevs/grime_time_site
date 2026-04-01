import type { CollectionSlug, File, Payload, PayloadRequest, Where } from 'payload'
import { seedDataMatchesExisting } from './diff'

export type SeedUpsertAction = 'created' | 'updated' | 'skipped'

export type SeedUpsertResult = {
  id: string | number
  action: SeedUpsertAction
}

export async function findDoc(
  payload: Payload,
  collection: CollectionSlug,
  where: Where,
  req: PayloadRequest,
): Promise<Record<string, unknown> | null> {
  const result = await payload.find({ collection, where, limit: 1, depth: 0, req })
  return (result.docs[0] as unknown as Record<string, unknown> | undefined) ?? null
}

export async function findDocId(
  payload: Payload,
  collection: CollectionSlug,
  where: Where,
  req: PayloadRequest,
): Promise<string | number | null> {
  const doc = await findDoc(payload, collection, where, req)
  const id = doc?.id
  return typeof id === 'string' || typeof id === 'number' ? id : null
}

export async function upsertBySlug(
  payload: Payload,
  collection: 'pages' | 'posts',
  slug: string,
  data: Record<string, unknown>,
  req: PayloadRequest,
): Promise<SeedUpsertResult> {
  const existing = await findDoc(payload, collection, { slug: { equals: slug } }, req)
  const ctx = { disableRevalidate: true as const }

  if (existing?.id != null) {
    if (seedDataMatchesExisting(existing, data)) {
      return { id: existing.id as string | number, action: 'skipped' }
    }

    const doc = await payload.update({
      collection,
      id: existing.id as string | number,
      data,
      depth: 0,
      context: ctx,
      req,
    })
    return { id: doc.id, action: 'updated' }
  }
  const doc = await payload.create({
    collection,
    data: data as never,
    depth: 0,
    context: ctx,
    req,
  })
  return { id: doc.id, action: 'created' }
}

export async function upsertMediaByFilename(
  payload: Payload,
  req: PayloadRequest,
  args: { filename: string; data: Record<string, unknown>; file?: File },
): Promise<SeedUpsertResult> {
  const existing = await findDoc(payload, 'media', { filename: { equals: args.filename } }, req)
  if (existing?.id != null) {
    if (seedDataMatchesExisting(existing, args.data)) {
      return { id: existing.id as string | number, action: 'skipped' }
    }

    const doc = await payload.update({
      collection: 'media',
      id: existing.id as string | number,
      data: args.data as never,
      ...(args.file ? { file: args.file } : {}),
      req,
    })
    return { id: doc.id, action: 'updated' }
  }
  if (!args.file) {
    throw new Error(`Seed media "${args.filename}": file is required when the asset does not exist yet`)
  }
  const doc = await payload.create({
    collection: 'media',
    data: args.data as never,
    file: args.file,
    req,
  })
  return { id: doc.id, action: 'created' }
}

export async function upsertCategoryBySlug(
  payload: Payload,
  req: PayloadRequest,
  data: { title: string; slug: string },
): Promise<SeedUpsertResult> {
  // Slug in DB is slugified (usually lowercase). Seed must use the same canonical slug for find,
  // or we duplicate and hit unique index — often masked as 25P02 when Promise.all runs many creates in one tx.
  let existing = await findDoc(payload, 'categories', { slug: { equals: data.slug } }, req)
  if (existing == null) {
    existing = await findDoc(payload, 'categories', { title: { equals: data.title } }, req)
  }

  const row = {
    ...data,
    generateSlug: false,
  }

  if (existing?.id != null) {
    if (seedDataMatchesExisting(existing, row)) {
      return { id: existing.id as string | number, action: 'skipped' }
    }

    const doc = await payload.update({
      collection: 'categories',
      id: existing.id as string | number,
      data: row,
      depth: 0,
      req,
    })
    return { id: doc.id, action: 'updated' }
  }
  const doc = await payload.create({
    collection: 'categories',
    data: row,
    depth: 0,
    req,
  })
  return { id: doc.id, action: 'created' }
}

export async function upsertFormByTitle(
  payload: Payload,
  req: PayloadRequest,
  title: string,
  data: Record<string, unknown>,
): Promise<SeedUpsertResult> {
  const existing = await findDoc(payload, 'forms', { title: { equals: title } }, req)
  if (existing?.id != null) {
    if (seedDataMatchesExisting(existing, data)) {
      return { id: existing.id as string | number, action: 'skipped' }
    }

    const doc = await payload.update({
      collection: 'forms',
      id: existing.id as string | number,
      data: data as never,
      depth: 0,
      req,
    })
    return { id: doc.id, action: 'updated' }
  }
  const doc = await payload.create({
    collection: 'forms',
    data: data as never,
    depth: 0,
    req,
  })
  return { id: doc.id, action: 'created' }
}

export async function upsertGlobalBySlug(
  payload: Payload,
  req: PayloadRequest,
  slug:
    | 'header'
    | 'footer'
    | 'pricing'
    | 'quoteSettings'
    | 'servicePlanSettings',
  data: Record<string, unknown>,
): Promise<SeedUpsertResult> {
  const existing = (await payload.findGlobal({
    slug,
    depth: 0,
    req,
  })) as unknown as Record<string, unknown>

  if (seedDataMatchesExisting(existing, data)) {
    return { id: slug, action: 'skipped' }
  }

  await payload.updateGlobal({
    slug,
    data,
    req,
  })

  return { id: slug, action: 'updated' }
}
