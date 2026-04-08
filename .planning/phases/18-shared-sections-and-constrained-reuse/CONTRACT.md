# Phase 18 Shared Sections Contract

Superseded on 2026-04-08 by the page-local block direction. Shared sections are no longer the target authoring model for the active composer work. Keep this file only as historical context for what phase 18 originally explored; active execution should follow the simplified model in `.planning/ROADMAP.xml`, `.planning/TASK-REGISTRY.xml`, and the updated phase plan direction note.

Date: 2026-04-04
Phase: 18 - Shared sections and constrained reuse authoring

## Final implementation decisions

- Linked shared-section instances are not content-editable locally in phase 18.
- Publishing a shared section updates all linked published pages immediately.
- Draft pages resolve against the latest published shared-section version in v1 rather than using snapshot isolation.
- `Replace local section with shared section` is part of phase 18.
- `Promote existing page section to shared section` is explicitly excluded from phase 18.

## Shared section documents

Shared sections are first-class CMS records. They are not anonymous JSON blobs with a label.

```ts
export type SharedSectionCategory =
  | 'hero'
  | 'content'
  | 'cta'
  | 'social-proof'
  | 'media'
  | 'utility'

export type SharedSectionStatus =
  | 'draft'
  | 'published'
  | 'archived'

export type SharedSectionPreviewStatus =
  | 'pending'
  | 'ready'
  | 'failed'

export interface SharedSectionPreview {
  url: string | null
  status: SharedSectionPreviewStatus
  updatedAt: string | null
  errorMessage?: string | null
}

export interface SharedSectionDocument {
  id: string
  name: string
  slug: string
  category: SharedSectionCategory
  tags: string[]
  description: string | null
  status: SharedSectionStatus
  structure: ComposerSectionNode
  preview: SharedSectionPreview
  currentVersion: number
  createdAt: string
  updatedAt: string
  createdBy: string | null
  updatedBy: string | null
  publishedAt: string | null
  archivedAt: string | null
}
```

## Shared section versions

Long-term history lives in a separate version collection or equivalent version surface, not embedded indefinitely into the main document.

```ts
export interface SharedSectionVersionDocument {
  id: string
  sharedSectionId: string
  version: number
  structure: ComposerSectionNode
  preview: SharedSectionPreview
  changeSummary: string | null
  createdAt: string
  createdBy: string | null
}
```

Boundary:

- Shared-section source records store source structure only.
- Page-instance metadata does not live on the shared source.

Examples of page-instance-only metadata:

- `anchorId`
- local visibility
- instance analytics label
- page-specific spacing variant
- page placement index

## Composer node model

Linked shared sections use a distinct node type. Do not represent them as normal sections with a boolean flag.

```ts
export interface ComposerBaseNode {
  id: string
  kind: string
}

export interface ComposerPageNode extends ComposerBaseNode {
  kind: 'page'
  children: ComposerTopLevelNode[]
}

export interface ComposerSectionNode extends ComposerBaseNode {
  kind: 'section'
  layout: SectionLayoutType
  children: ComposerRowNode[]
  props: Record<string, unknown>
  meta?: {
    detachedFromSharedSectionId?: string
    detachedFromVersion?: number
    detachedAt?: string
  }
}

export interface ComposerRowNode extends ComposerBaseNode {
  kind: 'row'
  children: ComposerColumnNode[]
  props: Record<string, unknown>
}

export interface ComposerColumnNode extends ComposerBaseNode {
  kind: 'column'
  children: ComposerBlockNode[]
  props: Record<string, unknown>
}

export interface ComposerBlockNode extends ComposerBaseNode {
  kind: 'block'
  blockType: string
  props: Record<string, unknown>
}

export interface SharedSectionInstanceOverrides {
  visibility?: {
    mobile?: boolean
    tablet?: boolean
    desktop?: boolean
  }
  anchorId?: string
  instanceLabel?: string
  spacingVariant?: 'default' | 'compact' | 'relaxed'
}

export interface ComposerSharedSectionInstanceNode extends ComposerBaseNode {
  kind: 'shared-section-instance'
  sharedSectionId: string
  syncedVersion: number | null
  overrides: SharedSectionInstanceOverrides
}

export type ComposerTopLevelNode =
  | ComposerSectionNode
  | ComposerSharedSectionInstanceNode
```

Rules:

- Local sections are page-owned.
- Shared-section instances are references.
- Detach converts a reference into a local concrete section.
- Source editing never mutates page-owned section trees directly.

## Shared-section lifecycle

Phase-18 creation entrypoint:

- `Create new shared section` from the shared-section library or the dedicated shared-section routes.

Phase-18 exclusions:

- No `Promote page section to shared section`.

This keeps the shared-source lifecycle clean in the first release.

## Shared-section routes

Routes:

- `/shared-sections`
- `/shared-sections/new`
- `/shared-sections/:id/edit`

The edit route reuses the builder shell but must feel globally scoped.

## Shared-section editor UX

The route should reuse the familiar builder composition, but the framing must clearly communicate global scope.

Expected layout:

- left structure panel
- center canvas
- right inspector

Header should include:

- back to shared-sections library
- shared-section name
- category
- tags
- status badge
- `Used on X pages`
- `Save Draft`
- `Publish`
- restore/version entrypoint

Global scope warning should stay visible near the canvas:

`You are editing a shared section source. Publishing updates all linked instances on published pages.`

Used-on panel:

- count in header
- expandable list of affected pages

## Save and publish contract

Save behavior:

- explicit save only
- no autosave for shared-section source editing

Reason:

- global asset editing needs clear version boundaries
- preview regeneration has a natural trigger
- draft vs publish stays understandable

Publish behavior:

- `Save Draft` persists shared-section draft changes
- `Save Draft` does not update published page output
- `Publish` creates a new published shared-section version
- `Publish` updates all linked published pages to the latest shared-section source
- draft pages also resolve against the latest published shared-section version in phase 18

Page publish and shared-section publish remain distinct:

- shared-section publish controls source availability
- page publish controls whether that page is live

## Linked-instance override boundary

Allowed local overrides:

```ts
export interface SharedSectionInstanceOverrides {
  visibility?: {
    mobile?: boolean
    tablet?: boolean
    desktop?: boolean
  }
  anchorId?: string
  instanceLabel?: string
  spacingVariant?: 'default' | 'compact' | 'relaxed'
}
```

Not allowed locally:

- block content
- headings
- button text
- media choices
- block order
- section layout
- colors and typography theme props
- adding or removing nested blocks

Rule:

- Linked shared-section instances are not content-editable locally in phase 18.
- Local adjustment is limited to constrained instance overrides.

## Actions to implement

Library and shared-route actions:

```ts
export interface CreateSharedSectionInput {
  name: string
  slug?: string
  category: SharedSectionCategory
  tags?: string[]
  description?: string | null
  initialStructure?: ComposerSectionNode | null
}

export interface UpdateSharedSectionDraftInput {
  id: string
  name?: string
  category?: SharedSectionCategory
  tags?: string[]
  description?: string | null
  structure?: ComposerSectionNode
}

export interface PublishSharedSectionInput {
  id: string
  changeSummary?: string | null
}

export interface RestoreSharedSectionVersionInput {
  sharedSectionId: string
  version: number
}
```

Page-composer actions:

```ts
export interface InsertSharedSectionIntoPageInput {
  pageId: string
  sharedSectionId: string
  index?: number
  overrides?: SharedSectionInstanceOverrides
}

export interface UpdateSharedSectionInstanceOverridesInput {
  pageId: string
  instanceNodeId: string
  overrides: SharedSectionInstanceOverrides
}

export interface DetachSharedSectionInstanceInput {
  pageId: string
  instanceNodeId: string
}

export interface ReplaceSectionWithSharedSectionInput {
  pageId: string
  nodeId: string
  sharedSectionId: string
  overrides?: SharedSectionInstanceOverrides
}
```

Behavior contract:

- Insert shared section into page:
  - create `shared-section-instance` node
  - store `sharedSectionId`
  - store current published version into `syncedVersion`
  - insert node at requested index
  - mark page dirty
- Update instance overrides:
  - mutate overrides only
  - never touch shared source
- Detach shared-section instance:
  - resolve current published shared-section structure
  - clone into local `section` node
  - preserve provenance metadata
  - replace instance node in place
  - mark page dirty
- Replace local section with shared section:
  - valid only for top-level local section nodes
  - replace node in place with shared-section instance
  - carry forward safe placement metadata when possible
  - mark page dirty

## Preview contract

Phase-18 shared-section previews are intentionally constrained.

Rules:

- one preview image per shared section
- auto-generated only
- generated on create
- regenerated on save or publish
- fixed aspect ratio
- no manual upload
- no cropping or editing UI
- preview failure does not block save or publish

```ts
export interface SharedSectionPreview {
  url: string | null
  status: 'pending' | 'ready' | 'failed'
  updatedAt: string | null
  errorMessage?: string | null
}
```

UI behavior:

- ready preview renders on library cards
- failed or missing preview renders a placeholder card state

## Roles and permissions

Use the existing permissions system. Do not invent a parallel permission model.

Capability surface:

```ts
export interface SharedSectionPermissions {
  canViewLibrary: boolean
  canCreate: boolean
  canEditDraft: boolean
  canPublish: boolean
  canRestoreVersion: boolean
  canInsertIntoPage: boolean
}
```

Practical rule:

- more users may insert shared sections into pages than may edit or publish the shared source

## Usage impact preview

Shared-section publishing must show impact before confirmation.

Minimum publish-preview behavior:

- show affected page count
- show affected page list
- show resulting version number when available

Example:

`Publishing this shared section will update 12 linked pages.`

No visual diff is required in phase 18.

## Test matrix

### 18-01 Shared section schema and persistence

- create shared section with valid category, tags, and structure
- reject invalid category
- initialize `status = draft`
- initialize `currentVersion = 1`
- initialize preview state
- save and fetch by id
- save and fetch by slug

### 18-02 Shared section library

- list shared sections
- filter by category
- filter by tags
- search by name
- render preview when ready
- render placeholder when failed or missing
- show usage count metadata

### 18-03 Create and edit route

- load `/shared-sections/:id/edit`
- show global editing banner
- show used-on count
- save draft updates draft state only
- publish creates new version and updates published state
- restore version recreates the correct restored structure
- users without permission cannot publish

### 18-04 Insert and link into page

- insert shared section creates `shared-section-instance`
- instance stores correct `sharedSectionId`
- instance stores synced version
- page becomes dirty after insert
- shared section renders in page composer correctly

### 18-05 Local override and detach behavior

- instance allows visibility override
- instance allows `anchorId` override
- instance allows `instanceLabel` override
- instance allows `spacingVariant` override
- instance does not allow content editing
- instance does not allow structural editing
- detach converts instance into local concrete section
- detached section preserves provenance metadata
- detached section no longer updates when source publishes a new version

### 18-06 Publish propagation and preview behavior

- publish shared section increments version
- publish updates linked instances across affected pages
- detached copies remain unchanged
- preview regenerates on save or publish
- preview failure does not block publish
- usage impact preview shows affected page list before publish

## Explicit exclusions

Do not implement in phase 18:

- promote page section to shared section
- arbitrary nested layout depth
- page-local editing of linked shared-section content
- visual diff between shared-section versions
- manual preview image upload or editing
- custom query builder for shared-section selection
- advanced approval workflow beyond existing role checks and publish permissions
