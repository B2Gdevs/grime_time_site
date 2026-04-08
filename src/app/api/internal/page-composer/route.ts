import { createLocalReq, type TypeWithVersion } from 'payload'

import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { hasContentAuthoringAccess } from '@/lib/auth/organizationAccess'
import {
  createPageComposerDocumentSeed,
  frontendPathToPageSlug,
  normalizePageComposerLayoutForSave,
  type PageComposerDocument,
  pageSlugToFrontendPath,
  type PageComposerPageSummary,
  type PageComposerVersionSummary,
} from '@/lib/pages/pageComposer'
import {
  buildPageDocumentBlocksForSave,
  createLegacyHeroGroupFromBlock,
  normalizePageLayoutBlocks,
} from '@/lib/pages/pageLayoutBlocks'
import type { Page } from '@/payload-types'

async function requireStaffPageComposerAuth() {
  const auth = await getCurrentAuthContext()

  if (!auth.realUser) {
    return null
  }

  if (!auth.isRealAdmin && !(await hasContentAuthoringAccess(auth.payload, auth.realUser))) {
    return null
  }

  return auth
}

function parsePagePath(request: Request): null | string {
  const pagePath = new URL(request.url).searchParams.get('pagePath')?.trim() || ''
  return pagePath || null
}

function parsePageId(request: Request): null | number {
  const pageId = Number(new URL(request.url).searchParams.get('pageId'))
  return Number.isInteger(pageId) && pageId > 0 ? pageId : null
}

function normalizeComposerPagePath(pagePath: null | string): null | string {
  const trimmed = pagePath?.trim() || ''

  if (!trimmed) {
    return null
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function toComposerDocument(page: Page, pagePath: string): PageComposerDocument {
  const layout = normalizePageLayoutBlocks({ page, pagePath })
  return {
    _status: page._status,
    hero: createLegacyHeroGroupFromBlock({
      block: layout.find((block) => block.blockType === 'heroBlock'),
      fallback: page.hero,
    }),
    id: page.id,
    layout,
    pagePath,
    publishedAt: page.publishedAt,
    slug: page.slug,
    title: page.title,
    updatedAt: page.updatedAt,
    visibility: page.visibility,
  }
}

function toComposerPageSummary(page: Page): PageComposerPageSummary {
  return {
    _status: page._status,
    id: page.id,
    pagePath: pageSlugToFrontendPath(page.slug),
    publishedAt: page.publishedAt,
    slug: page.slug,
    title: page.title,
    updatedAt: page.updatedAt,
    visibility: page.visibility,
  }
}

function cloneValue<T>(value: T): T {
  return structuredClone(value)
}

function toPageComposerVersionSummary(
  record: TypeWithVersion<Page>,
): PageComposerVersionSummary {
  const title = record.version.title?.trim() || 'Untitled page'
  const slug = record.version.slug?.trim() || ''

  return {
    createdAt: record.createdAt,
    id: record.id,
    latest: Boolean(record.latest),
    pagePath: pageSlugToFrontendPath(slug),
    slug,
    status: record.version._status === 'published' ? 'published' : 'draft',
    title,
    updatedAt: record.updatedAt,
  }
}

function stripNestedIds<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripNestedIds(item)) as T
  }

  if (value && typeof value === 'object') {
    const nextEntries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== 'id')
      .map(([key, entryValue]) => [key, stripNestedIds(entryValue)])

    return Object.fromEntries(nextEntries) as T
  }

  return value
}

function relationId(value: unknown): null | number {
  if (value && typeof value === 'object' && 'id' in value) {
    const record = value as { id?: null | number | string }
    return typeof record.id === 'number' ? record.id : null
  }

  return typeof value === 'number' ? value : null
}

async function findAvailableSlug(args: {
  payload: Awaited<ReturnType<typeof getCurrentAuthContext>>['payload']
  req: Awaited<ReturnType<typeof createLocalReq>>
  slug: string
}): Promise<string> {
  const baseSlug = args.slug.trim() || 'draft-page'

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`
    const existing = await args.payload.find({
      collection: 'pages',
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      req: args.req,
      where: {
        slug: {
          equals: candidate,
        },
      },
    })

    if (!existing.docs.length) {
      return candidate
    }
  }

  throw new Error('Unable to generate a unique draft slug.')
}

async function loadComposerPages(args: {
  payload: Awaited<ReturnType<typeof getCurrentAuthContext>>['payload']
  req: Awaited<ReturnType<typeof createLocalReq>>
}): Promise<PageComposerPageSummary[]> {
  const result = await args.payload.find({
    collection: 'pages',
    depth: 0,
    draft: true,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    req: args.req,
    sort: 'title',
  })

  return (result.docs as Page[]).map((page) => toComposerPageSummary(page))
}

async function loadPageVersions(args: {
  pageId: number
  payload: Awaited<ReturnType<typeof getCurrentAuthContext>>['payload']
  req: Awaited<ReturnType<typeof createLocalReq>>
}): Promise<PageComposerVersionSummary[]> {
  const result = await args.payload.findVersions({
    collection: 'pages',
    depth: 0,
    limit: 8,
    overrideAccess: false,
    pagination: false,
    req: args.req,
    sort: '-updatedAt',
    where: {
      parent: {
        equals: args.pageId,
      },
    },
  })

  return (result.docs as TypeWithVersion<Page>[]).map((record) => toPageComposerVersionSummary(record))
}

async function createComposerPage(args: {
  action: 'create-page' | 'publish-page' | 'save-draft'
  layout: Page['layout']
  payload: Awaited<ReturnType<typeof getCurrentAuthContext>>['payload']
  req: Awaited<ReturnType<typeof createLocalReq>>
  slug: string
  title: string
  visibility: Page['visibility']
}): Promise<Page> {
  const normalizedLayout = normalizePageComposerLayoutForSave(args.layout)
  const documentBlocks = buildPageDocumentBlocksForSave({
    layout: normalizedLayout,
  })

  const created = (await args.payload.create({
    collection: 'pages',
    data: {
      hero: documentBlocks.hero,
      layout: documentBlocks.layout,
      slug: args.slug,
      title: args.title,
      visibility: args.visibility,
    },
    depth: 2,
    draft: true,
    overrideAccess: false,
    req: args.req,
  })) as Page

  if (args.action !== 'publish-page') {
    return created
  }

  return (await args.payload.update({
    autosave: false,
    collection: 'pages',
    data: {
      _status: 'published',
      hero: documentBlocks.hero,
      layout: documentBlocks.layout,
      slug: args.slug,
      title: args.title,
      visibility: args.visibility,
    },
    depth: 2,
    draft: false,
    id: created.id,
    overrideAccess: false,
    req: args.req,
  })) as Page
}

async function restorePageVersion(args: {
  pageId: number
  payload: Awaited<ReturnType<typeof getCurrentAuthContext>>['payload']
  req: Awaited<ReturnType<typeof createLocalReq>>
  versionId: string
}): Promise<Page> {
  const version = (await args.payload.findVersionByID({
    collection: 'pages',
    id: args.versionId,
    overrideAccess: false,
    req: args.req,
  })) as TypeWithVersion<Page>

  if (Number(version.parent) !== args.pageId) {
    throw new Error('The selected version does not belong to this page.')
  }

  await args.payload.restoreVersion({
    collection: 'pages',
    draft: true,
    id: args.versionId,
    overrideAccess: false,
    req: args.req,
  })

  return (await args.payload.findByID({
    collection: 'pages',
    depth: 2,
    draft: true,
    id: args.pageId,
    overrideAccess: false,
    req: args.req,
  })) as Page
}

export async function GET(request: Request): Promise<Response> {
  const auth = await requireStaffPageComposerAuth()

  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pageId = parsePageId(request)
  const pagePath = normalizeComposerPagePath(parsePagePath(request))
  const slug = pageId ? null : frontendPathToPageSlug(pagePath || '')

  if (!pageId && !pagePath) {
    return Response.json({ error: 'A page path or page id is required.' }, { status: 400 })
  }

  if (!pageId && !slug) {
    return Response.json({ error: 'This route does not map to a page document.' }, { status: 400 })
  }

  const payloadReq = await createLocalReq({ user: auth.realUser || undefined }, auth.payload)
  const pages = await loadComposerPages({
    payload: auth.payload,
    req: payloadReq,
  })

  let page: Page | undefined

  try {
    page = pageId
      ? ((await auth.payload.findByID({
          collection: 'pages',
          depth: 2,
          draft: true,
          id: pageId,
          overrideAccess: false,
          req: payloadReq,
        })) as Page)
      : ((await auth.payload.find({
          collection: 'pages',
          depth: 2,
          draft: true,
          limit: 1,
          overrideAccess: false,
          pagination: false,
          req: payloadReq,
          where: {
            slug: {
              equals: slug,
            },
          },
        }))?.docs?.[0] as Page | undefined)
  } catch {
    page = undefined
  }

  if (!page) {
    return Response.json({
      ok: true,
      page: createPageComposerDocumentSeed({
        pagePath: pagePath || pageSlugToFrontendPath(slug),
      }),
      pages,
      versions: [],
    })
  }

  return Response.json({
    ok: true,
    page: toComposerDocument(page, pagePath || pageSlugToFrontendPath(page.slug)),
    pages,
    versions: await loadPageVersions({
      pageId: page.id,
      payload: auth.payload,
      req: payloadReq,
    }),
  })
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireStaffPageComposerAuth()

  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as
    | null
      | {
        action?: string
        layout?: Page['layout']
        pageId?: number
        pageIds?: number[]
        pagePath?: string
        sourcePageId?: number
        slug?: string
        title?: string
        versionId?: string
        versionIds?: string[]
        visibility?: Page['visibility']
      }

  const pageId = Number(body?.pageId)
  const pagePath = normalizeComposerPagePath(body?.pagePath?.trim() || null)
  const sourcePageId = Number(body?.sourcePageId)
  const title = body?.title?.trim() || ''
  const slug = body?.slug?.trim() || ''
  const layout = Array.isArray(body?.layout) ? body?.layout : null
  const action = body?.action || ''
  const versionId = body?.versionId?.trim() || ''
  const visibility = body?.visibility === 'private' ? 'private' : 'public'

  if (
    action !== 'save-draft' &&
    action !== 'publish-page' &&
    action !== 'create-page' &&
    action !== 'clone-page' &&
    action !== 'restore-page-version' &&
    action !== 'delete-draft' &&
    action !== 'delete-page' &&
    action !== 'bulk-delete-pages' &&
    action !== 'bulk-delete-page-versions'
  ) {
    return Response.json({ error: 'Unsupported composer action.' }, { status: 400 })
  }

  const payloadReq = await createLocalReq({ user: auth.realUser || undefined }, auth.payload)

  try {
    if (action === 'delete-draft') {
      if (!Number.isInteger(pageId) || pageId <= 0) {
        return Response.json({ error: 'Page id is required.' }, { status: 400 })
      }

      const existing = (await auth.payload.findByID({
        collection: 'pages',
        depth: 0,
        draft: true,
        id: pageId,
        overrideAccess: false,
        req: payloadReq,
      })) as Page

      if (existing._status === 'published') {
        return Response.json({ error: 'Published pages cannot be deleted here.' }, { status: 400 })
      }

      await auth.payload.delete({
        collection: 'pages',
        id: pageId,
        overrideAccess: false,
        req: payloadReq,
      })

      return Response.json({ ok: true })
    }

    if (action === 'delete-page') {
      if (!Number.isInteger(pageId) || pageId <= 0) {
        return Response.json({ error: 'Page id is required.' }, { status: 400 })
      }

      const existing = (await auth.payload.findByID({
        collection: 'pages',
        depth: 0,
        draft: true,
        id: pageId,
        overrideAccess: false,
        req: payloadReq,
      })) as Page | undefined

      if (!existing) {
        return Response.json({ error: 'Page not found.' }, { status: 404 })
      }

      await auth.payload.delete({
        collection: 'pages',
        id: pageId,
        overrideAccess: false,
        req: payloadReq,
      })

      return Response.json({
        ok: true,
        pages: await loadComposerPages({
          payload: auth.payload,
          req: payloadReq,
        }),
      })
    }

    if (action === 'bulk-delete-pages') {
      const rawIds = Array.isArray(body?.pageIds) ? body.pageIds : []
      const uniqueIds = [
        ...new Set(
          rawIds
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0),
        ),
      ]

      if (uniqueIds.length === 0) {
        return Response.json({ error: 'At least one valid page id is required.' }, { status: 400 })
      }

      for (const id of uniqueIds) {
        const existing = (await auth.payload.findByID({
          collection: 'pages',
          depth: 0,
          draft: true,
          id,
          overrideAccess: false,
          req: payloadReq,
        })) as Page | undefined

        if (!existing) {
          continue
        }

        await auth.payload.delete({
          collection: 'pages',
          id,
          overrideAccess: false,
          req: payloadReq,
        })
      }

      return Response.json({
        ok: true,
        pages: await loadComposerPages({
          payload: auth.payload,
          req: payloadReq,
        }),
      })
    }

    if (action === 'bulk-delete-page-versions') {
      if (!Number.isInteger(pageId) || pageId <= 0) {
        return Response.json({ error: 'Page id is required.' }, { status: 400 })
      }

      const rawVersionIds = Array.isArray(body?.versionIds) ? body.versionIds : []
      const versionIds = [...new Set(rawVersionIds.map((id) => String(id).trim()).filter(Boolean))]

      if (versionIds.length === 0) {
        return Response.json({ error: 'At least one version id is required.' }, { status: 400 })
      }

      const matched = await auth.payload.findVersions({
        collection: 'pages',
        depth: 0,
        draft: true,
        limit: Math.max(versionIds.length, 1),
        overrideAccess: false,
        pagination: false,
        req: payloadReq,
        where: {
          and: [
            {
              parent: {
                equals: pageId,
              },
            },
            {
              id: {
                in: versionIds,
              },
            },
          ],
        },
      })

      if (matched.docs.length !== versionIds.length) {
        return Response.json(
          { error: 'One or more versions were not found for this page.' },
          { status: 400 },
        )
      }

      const hasLatest = (matched.docs as TypeWithVersion<Page>[]).some((doc) => doc.latest)

      if (hasLatest) {
        return Response.json(
          {
            error:
              'Cannot delete the current draft snapshot. Deselect the row marked “Current draft” and try again.',
          },
          { status: 400 },
        )
      }

      await auth.payload.db.deleteVersions({
        collection: 'pages',
        req: payloadReq,
        where: {
          and: [
            {
              parent: {
                equals: pageId,
              },
            },
            {
              id: {
                in: versionIds,
              },
            },
          ],
        },
      })

      return Response.json({
        ok: true,
        versions: await loadPageVersions({
          pageId,
          payload: auth.payload,
          req: payloadReq,
        }),
      })
    }

    if (action === 'create-page') {
      if (!title || !slug) {
        return Response.json({ error: 'Title and slug are required.' }, { status: 400 })
      }

      const created = await createComposerPage({
        action,
        layout: [],
        payload: auth.payload,
        req: payloadReq,
        slug,
        title,
        visibility,
      })

      return Response.json({
        ok: true,
        page: toComposerDocument(created, pageSlugToFrontendPath(created.slug)),
        pages: await loadComposerPages({
          payload: auth.payload,
          req: payloadReq,
        }),
        versions: await loadPageVersions({
          pageId: created.id,
          payload: auth.payload,
          req: payloadReq,
        }),
      })
    }

    if (action === 'clone-page') {
      if (!Number.isInteger(sourcePageId) || sourcePageId <= 0) {
        return Response.json({ error: 'A source page is required to create a draft clone.' }, { status: 400 })
      }

      const sourcePage = (await auth.payload.findByID({
        collection: 'pages',
        depth: 2,
        draft: true,
        id: sourcePageId,
        overrideAccess: false,
        req: payloadReq,
      })) as Page

      const nextTitle = `${sourcePage.title} Draft`
      const nextSlug = await findAvailableSlug({
        payload: auth.payload,
        req: payloadReq,
        slug: `${sourcePage.slug}-draft`,
      })
      const normalizedLayout = normalizePageComposerLayoutForSave(
        cloneValue(
          normalizePageLayoutBlocks({
            page: sourcePage,
            pagePath: pageSlugToFrontendPath(sourcePage.slug),
          }),
        ),
      )
      const documentBlocks = buildPageDocumentBlocksForSave({
        fallbackHero: sourcePage.hero,
        layout: normalizedLayout,
      })
      const hero = cloneValue(documentBlocks.hero)
      const normalizedHero = stripNestedIds({
        ...hero,
        ...(relationId(hero.media) !== null ? { media: relationId(hero.media) } : {}),
      })

      const created = (await auth.payload.create({
        collection: 'pages',
        data: {
          hero: normalizedHero,
          layout: stripNestedIds(documentBlocks.layout),
          slug: nextSlug,
          title: nextTitle,
          visibility: 'private',
        },
        depth: 2,
        draft: true,
        overrideAccess: false,
        req: payloadReq,
      })) as Page

      return Response.json({
        ok: true,
        page: toComposerDocument(created, pageSlugToFrontendPath(created.slug)),
        pages: await loadComposerPages({
          payload: auth.payload,
          req: payloadReq,
        }),
        versions: await loadPageVersions({
          pageId: created.id,
          payload: auth.payload,
          req: payloadReq,
        }),
      })
    }

    if (action === 'restore-page-version') {
      if (!Number.isInteger(pageId) || pageId <= 0 || !versionId) {
        return Response.json({ error: 'Page id and version id are required.' }, { status: 400 })
      }

      const restored = await restorePageVersion({
        pageId,
        payload: auth.payload,
        req: payloadReq,
        versionId,
      })

      return Response.json({
        ok: true,
        page: toComposerDocument(restored, pageSlugToFrontendPath(restored.slug)),
        pages: await loadComposerPages({
          payload: auth.payload,
          req: payloadReq,
        }),
        versions: await loadPageVersions({
          pageId: restored.id,
          payload: auth.payload,
          req: payloadReq,
        }),
      })
    }

    if (!title || !slug || !layout) {
      return Response.json({ error: 'Title, slug, layout, and visibility are required.' }, { status: 400 })
    }

    if (!Number.isInteger(pageId) || pageId <= 0) {
      const created = await createComposerPage({
        action,
        layout,
        payload: auth.payload,
        req: payloadReq,
        slug,
        title,
        visibility,
      })

      return Response.json({
        ok: true,
        page: toComposerDocument(created, pagePath || pageSlugToFrontendPath(created.slug)),
        pages: await loadComposerPages({
          payload: auth.payload,
          req: payloadReq,
        }),
        versions: await loadPageVersions({
          pageId: created.id,
          payload: auth.payload,
          req: payloadReq,
        }),
      })
    }

    const normalizedLayout = normalizePageComposerLayoutForSave(layout)
    const documentBlocks = buildPageDocumentBlocksForSave({
      layout: normalizedLayout,
    })

    const updated = (await auth.payload.update({
      autosave: false,
      collection: 'pages',
      data: {
        _status: action === 'publish-page' ? 'published' : undefined,
        hero: documentBlocks.hero,
        layout: documentBlocks.layout,
        slug,
        title,
        visibility,
      },
      depth: 2,
      draft: action === 'save-draft',
      id: pageId,
      overrideAccess: false,
      req: payloadReq,
    })) as Page

    return Response.json({
      ok: true,
      page: toComposerDocument(updated, pageSlugToFrontendPath(updated.slug)),
      pages: await loadComposerPages({
        payload: auth.payload,
        req: payloadReq,
      }),
      versions: await loadPageVersions({
        pageId: updated.id,
        payload: auth.payload,
        req: payloadReq,
      }),
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to update the page draft.',
      },
      { status: 400 },
    )
  }
}
