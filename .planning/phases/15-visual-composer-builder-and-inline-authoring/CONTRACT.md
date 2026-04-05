# Phase 15 Registry And State Contract

Date: 2026-04-04
Phase: 15 - Visual composer foundations and builder shell

## Registry contract

Source of truth: `src/lib/pages/pageComposerBlockRegistry.ts`

Each registry entry defines:

- `type`
- `label`
- `category`
- `description`
- `keywords`
- `supportsInsert`
- `supportsNesting`
- `supportsReusable`

Registry rules fixed in phase 15:

- Top-level categories are `dynamic`, `static`, and `container`.
- The registry is seeded from the real `pages.layout[]` block types already rendered in production.
- `Custom HTML` is present in the registry and browser taxonomy from day one, but remains `supportsInsert: false` until phase 17.
- `serviceGrid`, `cta`, and `content` are the current reusable-capable definitions.
- `content` is the current container-class definition and advertises nesting support without adding full nested editing yet.

## Persisted page model

Source of truth: `src/lib/pages/pageComposer.ts`, `src/collections/Pages/index.ts`, and the generated `Page` type.

Phase-15 composer work continues to edit the saved Payload page document directly. The persisted shape used by the composer is:

- page identity: `id`, `title`, `slug`, `pagePath`
- workflow: `_status`, `publishedAt`, `updatedAt`, `visibility`
- content: `hero`, `layout[]`

Each layout block remains the existing Payload block schema. Phase 15 adds explicit block visibility to those saved blocks through `isHidden`.

## Renderer contract

Sources of truth:

- `src/blocks/RenderBlocks.tsx`
- `src/components/home/GrimeTimeMarketingHome.tsx`
- `src/lib/pages/pageLayoutVisibility.ts`

Renderer rules fixed in phase 15:

- Hidden blocks stay in the saved draft and in Structure.
- Hidden blocks receive a `hidden` badge and a hide/show quick action in the composer.
- Public rendering omits hidden blocks through `getVisiblePageLayoutBlocks(...)`.
- Homepage-specialized rendering also uses the visible layout so hidden `serviceGrid` blocks do not leak into the feature-card selection path.

## Structure contract

Source of truth: `src/components/admin-impersonation/PageComposerDrawer.tsx`

Structure exists only to answer:

- what blocks are on this page
- in what order
- where a new block can be inserted
- which block is selected
- what structural actions are available

Required row payload in phase 15:

- label
- `blockType`
- category badge
- variant badge when applicable
- reusable badge when applicable
- hidden badge when applicable

Required row actions in phase 15:

- drag reorder
- add below
- duplicate
- delete
- hide/show

Insertion rules fixed in phase 15:

- plus between rows and at the end of the page
- block library opens at the exact target index
- inserted block is created from the registry defaults
- inserted block becomes the selected block

## UI state contract

Phase 15 does not add a second hidden builder store. The drawer uses the current page document plus explicit ephemeral UI state.

Persisted authoring state:

- `draftPage`
- `draftPage.layout[]`
- title draft
- slug draft
- visibility draft

Ephemeral UI state:

- `activeTab`
- `selectedIndex`
- `availablePages`
- `isBlockLibraryOpen`
- `blockLibraryTargetIndex`
- `blockLibraryQuery`
- `dirty`
- media-slot selection and prompt state
- saving / loading status

## Deferred boundaries

- Linked reusable-block semantics are deferred to phase 17.
- Generic dynamic-data configuration is deferred; dynamic entries stay pre-wired.
- Full nested container editing is deferred to phase 17.
- `Custom HTML` rendering and safety rules are deferred to phase 17.
