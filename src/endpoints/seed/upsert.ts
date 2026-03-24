import type { CollectionSlug, File, Payload, PayloadRequest, Where } from 'payload'

export async function findDocId(
  payload: Payload,
  collection: CollectionSlug,
  where: Where,
  req: PayloadRequest,
): Promise<string | number | null> {
  const r = await payload.find({ collection, where, limit: 1, depth: 0, req })
  return r.docs[0]?.id ?? null
}

export async function upsertBySlug(
  payload: Payload,
  collection: 'pages' | 'posts',
  slug: string,
  data: Record<string, unknown>,
  req: PayloadRequest,
): Promise<{ id: string | number }> {
  const id = await findDocId(payload, collection, { slug: { equals: slug } }, req)
  const ctx = { disableRevalidate: true as const }
  if (id != null) {
    const doc = await payload.update({
      collection,
      id,
      data,
      depth: 0,
      context: ctx,
      req,
    })
    return { id: doc.id }
  }
  const doc = await payload.create({
    collection,
    data: data as never,
    depth: 0,
    context: ctx,
    req,
  })
  return { id: doc.id }
}

export async function upsertMediaByFilename(
  payload: Payload,
  req: PayloadRequest,
  args: { filename: string; data: Record<string, unknown>; file?: File },
): Promise<{ id: string | number }> {
  const id = await findDocId(payload, 'media', { filename: { equals: args.filename } }, req)
  if (id != null) {
    const doc = await payload.update({
      collection: 'media',
      id,
      data: args.data as never,
      req,
    })
    return { id: doc.id }
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
  return { id: doc.id }
}

export async function upsertCategoryBySlug(
  payload: Payload,
  req: PayloadRequest,
  data: { title: string; slug: string },
): Promise<{ id: string | number }> {
  // Slug in DB is slugified (usually lowercase). Seed must use the same canonical slug for find,
  // or we duplicate and hit unique index — often masked as 25P02 when Promise.all runs many creates in one tx.
  let id = await findDocId(payload, 'categories', { slug: { equals: data.slug } }, req)
  if (id == null) {
    id = await findDocId(payload, 'categories', { title: { equals: data.title } }, req)
  }

  const row = {
    ...data,
    generateSlug: false,
  }

  if (id != null) {
    const doc = await payload.update({
      collection: 'categories',
      id,
      data: row,
      depth: 0,
      req,
    })
    return { id: doc.id }
  }
  const doc = await payload.create({
    collection: 'categories',
    data: row,
    depth: 0,
    req,
  })
  return { id: doc.id }
}

export async function upsertFormByTitle(
  payload: Payload,
  req: PayloadRequest,
  title: string,
  data: Record<string, unknown>,
): Promise<{ id: string | number }> {
  const id = await findDocId(payload, 'forms', { title: { equals: title } }, req)
  if (id != null) {
    const doc = await payload.update({
      collection: 'forms',
      id,
      data: data as never,
      depth: 0,
      req,
    })
    return { id: doc.id }
  }
  const doc = await payload.create({
    collection: 'forms',
    data: data as never,
    depth: 0,
    req,
  })
  return { id: doc.id }
}
