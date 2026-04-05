# Phase 15 Block Audit

Date: 2026-04-04
Phase: 15 - Visual composer foundations and builder shell

## Scope

This audit captures the real block inventory that exists in the current Grime Time page model and composer path. It is grounded in the current `pages.layout[]` schema, `RenderBlocks`, `GrimeTimeMarketingHome`, and the composer registry in `src/lib/pages/pageComposerBlockRegistry.ts`.

Phase 15 covers the blocks that already exist in the saved page layout plus the first registry entry for `Custom HTML`. It does not convert the homepage hero or instant quote section into page-layout blocks yet. Those remain shell-level concerns outside the phase-15 registry.

## Current inventory

| Type | Label | Category | Renderer / source | Purpose | Content / media shape | Reusable | Slots / nesting | Phase-15 notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `serviceGrid` | Service grid | `static` | `src/blocks/ServiceGrid/*` | Core branded service sections, feature cards, and pricing-step explainers | Copy fields plus `services[]` rows with optional media | Yes | No nested child blocks | Existing variants are `interactive`, `featureCards`, and `pricingSteps`; this is the main reusable authoring block today |
| `pricingTable` | Pricing table | `dynamic` | `src/blocks/PricingTable/*` | Shared or inline pricing plans | Heading, plan data, optional global source | No | No | Dynamic because it can read the shared pricing global |
| `cta` | Call to action | `static` | `src/blocks/CallToAction/*` | Focused CTA band with links | Copy plus `links[]` | Yes | No | Insertable from the new block library |
| `content` | Content columns | `container` | `src/blocks/Content/*` | Multi-column rich text layout block | Rich text columns plus optional links | Yes | Registry says yes | Phase 15 only formalizes the container contract; deeper nested editing waits for phase 17 |
| `mediaBlock` | Media block | `static` | `src/blocks/MediaBlock/*` | Single image or video feature block | Single media relation plus block copy/settings | No | No | Hidden-state support added in phase 15 like the rest of the layout blocks |
| `archive` | Archive | `dynamic` | `src/blocks/ArchiveBlock/*` | Collection-driven post/archive surface | Query-like settings, selected docs, relation target | No | No | Dynamic registry entry only; no generic query builder added |
| `formBlock` | Form block | `dynamic` | `src/blocks/Form/*` | Payload form embedding | Selected form relation and intro settings | No | No | Dynamic because it resolves a selected form record |
| `contactRequest` | Contact request | `dynamic` | `src/blocks/ContactRequest/*` | First-party lead/contact intake block | Contact-request settings and layout variant | No | No | Treated as a pre-wired dynamic business block |
| `testimonialsBlock` | Testimonials | `dynamic` | `src/blocks/Testimonials/*` | Social-proof block fed by testimonial records | Selection mode, heading, limit, testimonial refs | No | No | Dynamic because it resolves testimonial data |
| `customHtml` | Custom HTML | `static` | Registry-only in phase 15 | Reserved advanced embed / trusted markup block | Planned custom markup payload | No | No | Visible in taxonomy as planned, not insertable until phase 17 safety work lands |

## Out-of-scope surfaces still outside the block list

- Homepage hero in `src/components/home/GrimeTimeMarketingHome.tsx`
- Homepage instant quote section in `src/components/InstantQuoteSection.tsx`
- Page-level title, slug, route preview, visibility, and draft/publish controls in the composer header

## Phase-15 audit conclusions

- The first real registry should stay anchored to the current Payload layout block types instead of inventing a second abstract block store.
- `serviceGrid`, `cta`, and `content` are the current best reusable-capable authoring blocks.
- `pricingTable`, `archive`, `formBlock`, `contactRequest`, and `testimonialsBlock` should stay categorized as pre-wired dynamic blocks rather than exposing a generic data-source builder.
- `content` is the only current container-class definition and should advertise container intent before nested child editing is implemented.
- `Custom HTML` belongs in the taxonomy now so the browser model is honest about future direction, but it should remain non-insertable until its rendering and safety model is implemented in phase 17.
- Hidden blocks should remain visible to editors in Structure with badges and quick actions while the public renderer omits them.
