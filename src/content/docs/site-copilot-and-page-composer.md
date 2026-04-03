# Site copilot and page composer

**Owner:** TBD  
**Last reviewed:** 2026-04-02  
**Audience:** Grime Time staff. Keep aligned with [Internal docs policy](../../.planning/workflows/internal-docs-policy.md).

**Where to read this:** Portal **Docs** at `/docs/site-copilot-and-page-composer` for signed-in staff.

## Why this matters

Grime Time is moving toward a visual page-authoring workflow. The goal is not just "more CMS controls." The goal is to make page changes easier than prompting the AI blindly, while still letting the assistant help with focused tasks.

That means the page composer and the site copilot have to be designed together.

## Current product reality

As of **2026-04-02**:

- There is **no dedicated `/home` route** in Grime Time.
- The public homepage is **`/`**, backed by the page with slug **`home`**.
- The homepage still uses a specialized React component for part of its composition path.
- The local media workbench is already strong for upload, generate, and swap operations, but it is not yet a full visual page composer.

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
