# Page composer folder layout (follow-up)

Visual page composer code (drawer, canvas, launcher, `PageComposerContext`, related UI) currently lives under `src/components/admin-impersonation/`. That mixes two concerns: **customer impersonation / operator tools** versus **marketing page authoring**.

**Planned cleanup (no behavior change):** move composer modules into a dedicated folder (for example `src/components/page-composer/` or `src/components/visual-page-composer/`), update imports site-wide, and keep admin-impersonation limited to impersonation and shared chrome tokens.

Tracked as deferred work after shipping the live-editing toggle move and build fixes; do it in one focused PR with grep-based verification and tests.
