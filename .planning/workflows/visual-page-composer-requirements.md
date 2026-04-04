# Visual page composer requirements

**Owner:** TBD  
**Last reviewed:** 2026-04-03  
**Planning anchors:** phases `15`, `16`, and `17`

## Goal

Build a visual page composer for Grime Time that lets staff assemble pages from reusable blocks, edit block content/configuration/media, reorder sections, preview responsive layouts, save drafts, and publish pages. The interaction model should feel close to modern no-code page builders such as Softr while staying grounded in Grime Time's existing Payload page model and design system.

## Core framing

- A page is a route-backed document composed of an ordered list of blocks.
- A block is the core compositional unit.
- The preview is the primary editing surface.
- The right rail is split into `Structure`, `Content`, `Media`, and `Publish`.
- The block library is the insertion surface.

Use these terms consistently:

- Page
- Block
- Block library
- Reusable block
- Instance
- Slot
- Draft
- Published version

## Product jobs

Staff must be able to:

- create a new page
- add blocks from a library
- reorder blocks visually
- duplicate, remove, or disable blocks
- edit selected block content/settings/media
- preview desktop, tablet, and mobile layouts
- save draft changes
- publish valid page changes confidently

## Information architecture

### Preview canvas

- live visual rendering of ordered blocks
- click to select block
- hover state and quick actions
- desktop / tablet / mobile preview
- scrollable full-page preview
- optional empty-state drop zones between blocks

### Right composer rail

Tabs:

- Structure
- Content
- Media
- Publish

### Block library

- searchable
- categorized
- shows thumbnail/name/description
- inserts at the chosen target position

## Locked UX rules

### Avoid redundancy

Do not repeat current page identity inside Structure or elsewhere if the header already shows it.

Remove:

- repeated page labels such as `Home` inside Structure
- redundant draft explanation text
- duplicated page metadata across tabs
- standalone “Add reusable section” as a major composer pattern

### Softr-style insertion

Insertion uses:

- plus between blocks
- plus at end of page
- categorized block browser
- insert into exact target position
- newly inserted block becomes selected

### Page-level controls stay in the header

The header owns:

- title
- slug
- working page
- create draft
- visibility
- route preview

## Structure tab contract

Structure should answer only:

- what blocks are on this page?
- in what order?
- where can I insert another block?
- what is selected?
- what quick structural actions can I take?

Required row contents:

- block label/title
- block type
- optional icon
- badges such as reusable / hidden / dynamic / custom HTML

Required row actions:

- add below
- duplicate
- delete
- hide/show
- drag reorder

Selection must stay synchronized with preview.

## Block taxonomy

Top-level categories:

- Dynamic
- Static
- Container

`Custom HTML` must exist as a first-class block type in the composer taxonomy and registry.

## Existing-block audit requirement

Before over-expanding the system, audit the currently implemented page/composer sections and classify each by:

- current name
- purpose
- category
- content fields needed
- media fields needed
- reusable support
- slot/nesting support

The first real block registry should be seeded from actual implemented blocks, not just abstract ideas.

## State and model direction

### Page model

At minimum:

- `id`
- `title`
- `slug`
- `status`
- `visibility`
- `seo`
- `blocks[]`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`
- `publishedAt`

### Block instance model

At minimum:

- `id`
- `type`
- `label`
- `content`
- `media`
- `settings`
- `visibility`
- `dataSource`
- `slots/children`
- `reusableBlockId`
- `isDetachedFromReusable`

### UI state

At minimum:

- `selectedBlockId`
- `activeTab`
- `previewMode`
- `currentPageId`
- `currentDraftId`
- `insertionTarget`
- `expandedStructureIds`
- `isBlockLibraryOpen`
- `dirty`

## Recommended implementation stream

### Phase 15

Foundations and builder shell:

- current block audit
- registry contract
- top-bar cleanup
- dropdown z-index fix
- Structure redesign
- categorized block browser

### Phase 16

Core editing and publish workflow:

- selection sync
- hover actions
- inline editing
- responsive preview
- draft switching
- publish validation summary

### Phase 17

Reuse, dynamic data, containers, and custom HTML:

- reusable blocks
- pre-wired dynamic blocks
- container slots and validation
- custom HTML block

## Open implementation questions

- Are reusable blocks linked-by-reference in MVP or copy-on-insert by default?
- Do dynamic blocks query Payload directly or through view-model adapters?
- How deep should container nesting go in the MVP?
- Should hidden blocks stay visible to editors with badges or disappear entirely from preview?
- What safe-rendering path should `Custom HTML` use?
