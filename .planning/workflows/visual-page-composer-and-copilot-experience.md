# Visual page composer and copilot experience

**Owner:** TBD  
**Last reviewed:** 2026-04-03  
**Tools:** Payload pages + drafts, local page-media workbench, Assistant UI, OpenAI Apps SDK guidance

Planning anchors
- Phase: `13`
- Follow-on phases: `15`, `16`, and `17`
- Tasks: `13-01` through `13-06`, then `15-01` through `17-05`
- Related decisions: `D-content-004`, `D-ai-003`, `D-content-012`, `D-content-013`

## Why this doc exists

The current Grime Time public site already has three useful ingredients:

1. Payload `pages` with drafts and layout blocks.
2. A local-only page media workbench that can upload, generate, swap, and replace media in place.
3. An Assistant UI copilot shell on the portal side.

What it does not have yet is a unified authoring model for sections, page creation, and focused AI help. This doc defines that target before implementation fragments into more one-off prompt boxes and page-specific React.

## Current state

As of **2026-04-02**:

- There is **no dedicated `/home` route** in Grime Time.
- The public homepage is **`/`**, and it loads the Payload page with slug **`home`**.
- [`src/app/(frontend)/page.tsx`](../../src/app/(frontend)/page.tsx) renders [`src/components/home/GrimeTimeMarketingHome.tsx`](../../src/components/home/GrimeTimeMarketingHome.tsx) instead of the generic public-page renderer.
- `GrimeTimeMarketingHome` treats the first two `serviceGrid` blocks as home-specific sections and renders the rest through `RenderBlocks`.
- [`src/components/admin-impersonation/PageMediaDevtoolsDrawer.tsx`](../../src/components/admin-impersonation/PageMediaDevtoolsDrawer.tsx) already gives admins a strong localhost-only flow for page-slot media editing.

That is why swapping "sections from `/home` onto `/`" feels harder than it should be: in the actual codebase, those sections are not yet modeled as portable section units.

## Locked direction

The owner clarified two phase-13 choices on **2026-04-02**:

- **Normalize `/` first.** The current service and "what we do" sections that feel like `/home` should become reusable section types that can be swapped onto `/`.
- **`/home` does not need to exist as a route.** Its useful parts should survive as reusable section patterns.
- **The first real composer pass should be staff-safe.** Staff should be able to use it immediately; localhost-only is too narrow for the first production-value pass.

## Product direction

### 1. Keep Payload as the source of truth

- The visual composer should write into the existing `pages` document.
- Drafts, versions, title, slug, and publish state remain part of the Payload page lifecycle.
- We are not building a second hidden page-builder store.

### 2. Normalize reusable sections before building more controls

The first meaningful authoring upgrade is not drag-drop by itself. It is a reusable section registry that turns current page-specific structure into portable section types.

Near-term candidates:

- hero frame
- service lane card band
- pricing explainer band
- proof/gallery treatments
- CTA and trust bands

Each section needs:

- a stable type/id
- a human label
- a compact summary for the composer
- field-path awareness for save/update targeting
- selection metadata so the assistant can act on the focused section

### 3. Grow the local workbench into a page composer

The current media drawer is the right seed, not a throwaway prototype.

Target workbench surfaces:

- `Structure`: reorder, add, duplicate, remove, focus section
- `Content`: edit text and settings for the selected section
- `Media`: keep upload/generate/swap flows, but in the context of the selected section
- `Publish`: title, slug, draft/public state, preview, publish

Phase 13 should start **staff-safe and authenticated**, not localhost-only. The existing localhost media drawer can remain as a developer-oriented precursor, but the first real composer needs to be usable by staff immediately.

## Builder follow-on stream

The next composer waves should make the tool feel like a real block builder instead of a strong-but-obvious CMS workbench.

Locked follow-on rules:

- The page preview is the primary editing surface.
- The working-page switcher, draft controls, and page metadata must become compact top-bar controls rather than explanatory subpanels.
- The dropdown layering bug is phase-blocking and must be fixed before broader UX polish ships.
- The first implementation step is a real audit of existing page/template blocks into a formal block inventory and registry.
- Structure should be the ordered block organizer only, not a page-identity panel.
- Softr-style insertion is the rule: plus targets and a categorized block browser.
- Inline editing starts with high-value text fields only: headings, paragraph content, and CTA labels, after the shell/registry work stabilizes.
- Preview and structure must share one selected-block model.
- Hover affordances should expose small direct-manipulation controls: add below, duplicate, delete.
- The structure panel should explain each block row at a glance with type plus reusable/hidden/dynamic badges.
- Deeper settings remain in the sidebar; the preview handles the immediate edits.
- The composer remains block-constrained. Reuse and composition are the freedom, not arbitrary styling knobs.
- `Custom HTML` is a first-class block type in the taxonomy and registry, even if its deeper safety model lands in a later phase.

### 4. Treat page creation as a first-class workflow

The admin needs to:

- create a page
- set name/title
- set slug
- keep it draft/private if needed
- preview before publish

If a value is shared or feeds business logic, the UI should warn about that explicitly instead of pretending every field is harmless page copy.

## AI and chat design rules

This phase should use the official guidance the user linked, not a repo-local interpretation detached from current docs.

### OpenAI Apps guidance

From OpenAI's Apps SDK UX principles:

- **Extract, don't port**: focus on atomic authoring actions instead of recreating a full CMS inside chat.
- **Design for conversational entry**: support fuzzy asks like "make this section feel tighter" and direct asks like "swap this card with the waterfront version."
- **Use UI selectively**: the conversation handles context, history, and follow-up; UI should clarify actions or present structured results.
- **Optimize for conversation, not navigation**: keep tools and responses small and composable.

From OpenAI's Apps SDK UI guidance:

- Use **inline** surfaces for quick confirmations and lightweight actions.
- Use **fullscreen/modal** surfaces for richer multi-step workflows.
- Do not overload inline cards with deep navigation, nested scrolling, or lots of actions.
- Let the composer remain part of the experience during richer workflows.

References:

- https://developers.openai.com/apps-sdk/concepts/ux-principles
- https://developers.openai.com/apps-sdk/concepts/ui-guidelines

### Assistant UI guidance

From Assistant UI:

- **Interactables** are persistent UI outside the chat thread whose state both the user and the assistant can read/update.
- They are a fit for **forms the AI pre-fills**, **dashboards that update from conversation**, and **canvas/editor components the AI can manipulate**.
- **Selected** interactables let the assistant know which object the user is focused on.
- Intelligent components can combine readable UI, assistant instructions, tools, and model context.

References:

- https://www.assistant-ui.com/docs/guides/interactables
- https://www.assistant-ui.com/docs/copilots/motivation

## Grime Time implementation rules

### Shared context model

The assistant should receive:

- current page
- selected section
- selected media slot

That context should come from assistant-aware state, not from fragile prompt text alone.

### Focused generation sessions

The media-generation experience should become a focused mode over the shared copilot shell:

- modal over the page/composer
- explicit tabs above the composer (for example `Image`, `Video`, `Gallery`)
- required mode selection before generation
- short-lived local history is acceptable
- accepted results persist to Payload media and page drafts

This keeps the flow conversational without forcing every prompt into the main long-lived thread.

### Writes and publishing

- AI can assist with draft edits.
- Publishing requires explicit human confirmation.
- If a field is shared or calculated, the UI should say so before save/publish.
- Staff-safe does not mean AI-safe by default. Write and publish boundaries still need explicit confirmation and auditability.

## Non-goals

- Full production no-code builder in one pass
- Replacing Payload admin entirely
- Turning chat into a complete duplicate of every admin screen
- Letting AI publish or mutate broad site state without visible confirmation

## Local repo references

- [`src/collections/Pages/index.ts`](../../src/collections/Pages/index.ts)
- [`src/app/(frontend)/page.tsx`](../../src/app/(frontend)/page.tsx)
- [`src/app/(frontend)/[slug]/page.tsx`](../../src/app/(frontend)/[slug]/page.tsx)
- [`src/components/home/GrimeTimeMarketingHome.tsx`](../../src/components/home/GrimeTimeMarketingHome.tsx)
- [`src/components/admin-impersonation/PageMediaDevtoolsDrawer.tsx`](../../src/components/admin-impersonation/PageMediaDevtoolsDrawer.tsx)
- [`src/components/admin-impersonation/PageMediaDevtoolsContext.tsx`](../../src/components/admin-impersonation/PageMediaDevtoolsContext.tsx)
- [`src/components/admin-impersonation/InlinePageMediaEditor.tsx`](../../src/components/admin-impersonation/InlinePageMediaEditor.tsx)
- [`src/components/copilot/PortalCopilot.tsx`](../../src/components/copilot/PortalCopilot.tsx)
- [`src/lib/pages/queryPublicPageBySlug.ts`](../../src/lib/pages/queryPublicPageBySlug.ts)
- [`src/endpoints/seed/home.ts`](../../src/endpoints/seed/home.ts)
