# Site copilot and page composer

**Owner:** TBD  
**Last reviewed:** 2026-04-06  
**Audience:** Grime Time staff. Keep aligned with [Internal docs policy](../../.planning/workflows/internal-docs-policy.md).

**Where to read this:** Portal **Docs** at `/docs/site-copilot-and-page-composer` for signed-in staff.

## Why this matters

Grime Time is moving toward a visual page-authoring workflow. The goal is not just "more CMS controls." The goal is to make page changes easier than prompting the AI blindly, while still letting the assistant help with focused tasks.

That means the page composer and the site copilot have to be designed together.

## Current product reality

As of **2026-04-06**:

- There is **no dedicated `/home` route** in Grime Time.
- The public homepage is **`/`**, backed by the page with slug **`home`**.
- The homepage still uses a specialized React component for part of its composition path.
- The site copilot is now the main floating operator shell on the frontend: chat stays first, and impersonation or admin actions live in a dedicated tools view inside that same surface.
- The portal/customer dashboard now uses that same copilot container for real-admin operator access instead of maintaining a separate top toolbar. Admin shortcuts such as `Home` and `Ops` live inside the shared tools view.
- The site copilot no longer needs a dedicated `Composer` tab. The copilot header stays focused on `Chat` and `Tools`.
- The standalone floating composer remains only as the non-copilot fallback path. In the normal admin path, the composer stays mounted behind the shared copilot shell while the live page stays interactive beside it.
- When composer mode is active on the live page, page-level controls now move into the same hovering live-canvas toolbar as the preview-mode buttons instead of pushing the page down or living in a separate panel header.
- Real admins on the homepage now auto-enter composer mode by default. The tools view no longer needs a separate composer on/off toggle for that primary flow.
- That live-canvas toolbar is now the single source of truth for composer mode on the live page: it owns the `Structure` and `Publish` controls, uses icon-plus-tooltip viewport controls, carries the explicit `Exit composer` action, and exposes the current page preview link.
- Hiding the site copilot no longer shuts the composer down. Composer state stays active until staff explicitly turn it off from the live-canvas toolbar.
- The direct-on-page text editing pass now covers more of the homepage hero, selected `serviceGrid` blocks, page-local inline pricing tables, CTA blocks, Content blocks, and testimonials section heading/intro copy. Staff can edit key text directly in the canvas instead of leaving the page for the content panel.
- The homepage hero now participates in the same visual structure flow as layout blocks, so it can be selected from the canvas and the structure list instead of sitting outside the block model.
- Inline add-block controls now live on block borders in the live canvas and open the same shared block chooser used by structure mode instead of pushing staff back through the old embedded structure drawer overlay or a second insertion UI.
- Sparkle actions on those inline text fields now open a focused text-generation session in the copilot with the exact target field and current copy, rather than a generic composer jump.
- Block-level hover chrome is lighter now: the top hover rail stays focused on selection context, while hide, duplicate, and delete move into smaller edge affordances with tooltips and a destructive red delete action.
- Focused media sessions now render an app-like media workbench inside the copilot itself. Gallery reuse, image/video generation, and slot-aware swapping no longer depend on a separate standalone media rail.
- Frontend signed-in affordances should use Clerk-hosted UI. The public-shell sign-in card and the portal/app sidebar should not drift into separate custom logout flows.
- The local media workbench is already strong for upload, generate, and swap operations, and its page-level actions should continue to converge into the shared copilot-plus-composer model rather than drifting into standalone overlays.
- Assistant UI cloud-backed persistence is now active in the shared copilot runtime. The full frontend and portal shells sit inside the same assistant-ui runtime provider, thread restore persists through Assistant Cloud, and the current live canvas, homepage hero, and selected section blocks now register as assistant-ui interactables so the copilot sees the active visual context.

## Locked direction for phase 13

- Normalize **`/`** first.
- Treat the current service and **"what we do"** ideas as reusable sections that can be swapped onto `/`.
- **`/home` does not need to exist** as a route if those sections become reusable.
- The first real composer pass should be **staff-safe for immediate use**, not limited to localhost-only developer tooling.

## Core rules

### 1. Payload pages stay the source of truth

- The visual composer should edit the existing `pages` document.
- Drafts, versions, title, slug, and publish state remain part of the Payload page lifecycle.
- We are not building a second hidden page-builder store.

### 2. The assistant needs focused context

The assistant should know what the user is working on:

- current page
- selected section
- selected media slot

If the user says "tighten this copy" or "replace this image," the assistant should not have to guess.

### 3. Section selection is part of the UX

The page composer should make selection obvious:

- clicked section becomes the active section
- the active section gets the editing controls
- the assistant uses that selected section as the current target

This follows the Assistant UI idea of **interactables** with **selected** state.

### 4. Keep chat conversational, not screen-heavy

OpenAI's Apps guidance is the right bar:

- extract focused jobs instead of porting a full app into chat
- use UI selectively
- optimize for conversation instead of deep navigation

That means:

- quick confirmations can be inline
- richer editing and media generation can open in a modal or fullscreen surface
- chat should stay part of the flow, not disappear when the UI gets richer
- operator tools should feel like another copilot view, not a second unrelated floating app

## Media-generation rule

The media flow should move toward one shared model:

1. Open a focused modal over the page/composer.
2. Show explicit tabs above the composer, such as `Image`, `Video`, or `Gallery`.
3. Require the user to pick a mode or cancel.
4. Keep the session history local and short-lived if needed.
5. Persist accepted outputs into Payload media records and page drafts.

This is better than scattering separate prompt boxes across the app.

## Page composer rule

The page composer should eventually expose four authoring surfaces:

- `Structure` - add, remove, duplicate, reorder sections
- `Content` - edit text and section settings
- `Media` - upload, generate, swap, reuse media
- `Publish` - title, slug, draft/public state, preview, publish

The first pass should be **staff-safe and authenticated** while the interaction model settles. Localhost-only tools can still exist for narrower developer workflows, but they are not the main delivery target anymore.

## Shell rule

- The live page remains the primary visual canvas.
- The site copilot is the first floating shell for conversation and operator actions.
- The same copilot shell should be reused across public-site and portal surfaces rather than splitting operator controls into separate floating UIs.
- The shared operator tools view should focus on page-authoring entry points and admin navigation, not local-only media-debug affordances.
- When the copilot is active, the page composer should be controlled from the shared `Tools` surface instead of spinning up a second independent shell. Separate composer chrome is only a fallback for non-copilot authoring paths.
- `Structure` belongs to the hovering live-canvas bar. The copilot tools view should own operator navigation and deeper tool surfaces, not a second persistent composer toggle for the homepage admin flow.
- The composer admin bar should carry page breadcrumbs, page identity, route inputs, and publish controls while the section tabs stay focused on structure, content, media, and publish workflows.
- On the live page, the hovering canvas toolbar should be authoritative for composer tabs and shutdown. The copilot shell can be hidden independently without cancelling the active composer session.
- Neither surface should permanently consume page layout width on the public site.

## Shared and calculated values

Some fields may later be reused outside one page or feed business logic. When that happens:

- the UI should warn that the value is shared or calculated
- the assistant should not silently rewrite it as if it were page-local prose
- publish should stay explicit

## Official references

- OpenAI Apps SDK UX principles: https://developers.openai.com/apps-sdk/concepts/ux-principles
- OpenAI Apps SDK UI guidelines: https://developers.openai.com/apps-sdk/concepts/ui-guidelines
- Assistant UI interactables: https://www.assistant-ui.com/docs/guides/interactables
- Assistant UI intelligent components: https://www.assistant-ui.com/docs/copilots/motivation

## Local repo references

- [`src/collections/Pages/index.ts`](../../src/collections/Pages/index.ts)
- [`src/app/(frontend)/page.tsx`](../../src/app/(frontend)/page.tsx)
- [`src/components/home/GrimeTimeMarketingHome.tsx`](../../src/components/home/GrimeTimeMarketingHome.tsx)
- [`src/components/admin-impersonation/PageMediaDevtoolsDrawer.tsx`](../../src/components/admin-impersonation/PageMediaDevtoolsDrawer.tsx)
- [`src/components/admin-impersonation/PageMediaDevtoolsContext.tsx`](../../src/components/admin-impersonation/PageMediaDevtoolsContext.tsx)
- [`src/components/copilot/PortalCopilot.tsx`](../../src/components/copilot/PortalCopilot.tsx)
- [Visual page composer and copilot experience](../../../.planning/workflows/visual-page-composer-and-copilot-experience.md)
