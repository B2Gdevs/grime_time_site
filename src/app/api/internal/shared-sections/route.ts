import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { resolveSharedSectionPermissions } from '@/lib/auth/sharedSectionPermissions'
import {
  createSharedSectionDraft,
  loadSharedSectionsLibrary,
  publishSharedSection,
  saveSharedSectionDraft,
} from '@/lib/pages/sharedSectionLibrary'
import {
  sharedSectionCategoryValues,
  sharedSectionStatusValues,
  validateSharedSectionStructure,
  type ComposerSectionNode,
  type SharedSectionCategory,
  type SharedSectionStatus,
} from '@/lib/pages/sharedSections'

function parseId(value: null | string): null | number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function isSharedSectionCategory(value: string): value is SharedSectionCategory {
  return sharedSectionCategoryValues.includes(value as SharedSectionCategory)
}

function isSharedSectionStatus(value: string): value is SharedSectionStatus {
  return sharedSectionStatusValues.includes(value as SharedSectionStatus)
}

async function requireSharedSectionAccess() {
  const auth = await getCurrentAuthContext()

  if (!auth.realUser) {
    return null
  }

  const permissions = await resolveSharedSectionPermissions(auth.payload, auth.realUser)
  if (!permissions.canViewLibrary) {
    return null
  }

  return {
    auth,
    permissions,
  }
}

export async function GET(request: Request): Promise<Response> {
  const access = await requireSharedSectionAccess()

  if (!access) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const id = parseId(url.searchParams.get('id'))
  const category = url.searchParams.get('category')
  const search = url.searchParams.get('search')
  const status = url.searchParams.get('status')
  const tag = url.searchParams.get('tag')

  if (category && !isSharedSectionCategory(category)) {
    return Response.json({ error: 'Invalid category.' }, { status: 400 })
  }

  if (status && !isSharedSectionStatus(status)) {
    return Response.json({ error: 'Invalid status.' }, { status: 400 })
  }

  const normalizedStatus = status && isSharedSectionStatus(status) ? status : null

  try {
    const result = await loadSharedSectionsLibrary({
      auth: access.auth,
      category,
      id,
      search,
      status: normalizedStatus,
      tag,
    })

    return Response.json({
      items: result.items,
      permissions: result.permissions,
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to load shared sections.',
      },
      { status: id ? 404 : 500 },
    )
  }
}

export async function POST(request: Request): Promise<Response> {
  const access = await requireSharedSectionAccess()

  if (!access) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as
    | null
    | {
        action?: string
        category?: string
        description?: null | string
        id?: number
        name?: string
        slug?: null | string
        structure?: ComposerSectionNode
        tags?: string[]
      }

  const action = body?.action?.trim() || ''
  const id = typeof body?.id === 'number' ? body.id : null
  const name = body?.name?.trim() || ''
  const slug = body?.slug?.trim() || null
  const description = typeof body?.description === 'string' ? body.description : null
  const tags = Array.isArray(body?.tags) ? body.tags.filter((tag): tag is string => typeof tag === 'string') : []
  const category = body?.category?.trim() || ''

  if (
    action !== 'create-shared-section' &&
    action !== 'save-draft' &&
    action !== 'publish-shared-section'
  ) {
    return Response.json({ error: 'Unsupported shared-section action.' }, { status: 400 })
  }

  if (action === 'publish-shared-section' && !access.permissions.canPublish) {
    return Response.json({ error: 'You do not have permission to publish shared sections.' }, { status: 403 })
  }

  if (action === 'create-shared-section' && !access.permissions.canCreate) {
    return Response.json({ error: 'You do not have permission to create shared sections.' }, { status: 403 })
  }

  if (action === 'save-draft' && !access.permissions.canEditDraft) {
    return Response.json({ error: 'You do not have permission to edit shared-section drafts.' }, { status: 403 })
  }

  if (
    (action === 'create-shared-section' || action === 'save-draft' || action === 'publish-shared-section') &&
    category &&
    !isSharedSectionCategory(category)
  ) {
    return Response.json({ error: 'Invalid category.' }, { status: 400 })
  }

  if (action === 'create-shared-section' && (!name || !category)) {
    return Response.json({ error: 'Name and category are required.' }, { status: 400 })
  }

  if ((action === 'save-draft' || action === 'publish-shared-section') && !id) {
    return Response.json({ error: 'Shared section id is required.' }, { status: 400 })
  }

  if (body?.structure !== undefined) {
    const validated = validateSharedSectionStructure(body.structure)
    if (!validated.ok) {
      return Response.json(
        { error: validated.issues[0] || 'Shared section structure is invalid.' },
        { status: 400 },
      )
    }
  }

  try {
    const item =
      action === 'create-shared-section'
        ? await createSharedSectionDraft({
            auth: access.auth,
            data: {
              category: category as SharedSectionCategory,
              description,
              name,
              slug,
              structure: body?.structure,
              tags,
            },
          })
        : action === 'save-draft'
          ? await saveSharedSectionDraft({
              auth: access.auth,
              data: {
                category: category ? (category as SharedSectionCategory) : undefined,
                description,
                id: id as number,
                name: name || undefined,
                slug,
                structure: body?.structure,
                tags,
              },
            })
          : await publishSharedSection({
              auth: access.auth,
              data: {
                category: category ? (category as SharedSectionCategory) : undefined,
                description,
                id: id as number,
                name: name || undefined,
                slug,
                structure: body?.structure,
                tags,
              },
            })

    return Response.json({ item, permissions: access.permissions })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to save the shared section.',
      },
      { status: 400 },
    )
  }
}
