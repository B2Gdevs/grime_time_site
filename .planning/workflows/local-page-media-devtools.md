# Local Page Media Devtools

## Goal

Give the developer a fast local-only way to inspect and swap the media currently visible on a public page without leaving the page or opening Payload admin.

## Scope

- Extend the existing admin preview / impersonation toolbar on frontend routes.
- Add a sidebar or sheet that lists media references resolved for the current page.
- Each item should show:
  - page label / section label
  - current media record id
  - filename / alt when available
  - preview thumbnail when available
- Support two actions:
  - replace the underlying file on the existing media record
  - create a new media record and replace the current page relationship with that new record

## Hard gates

- Real admin only.
- Request host must be `localhost` or `127.0.0.1`.
- Available on local dev server and local `next start` only.
- Not intended as a production staff workflow.

## Technical shape

- Derive a page-media registry from the current page's Payload data:
  - hero media
  - media blocks
  - service-grid row media
  - any homepage-specialized media derived from the same `pages` document
- Keep registry entries precise about the relationship path so create-and-swap can update one page field without guessing.
- Prefer small guarded internal routes over trying to post directly into Payload admin forms.

## Non-goals

- Production inline CMS.
- Arbitrary collection editing from the public site.
- Bulk media management across the whole site.
- Automatic AI image generation from this sidebar in the first pass.

## Verification

- Local admin on `/` can open the page-media sidebar and see current page media entries.
- Replace-in-place changes the existing media asset and the page reflects the new file.
- Create-and-swap creates a new media document and updates only the targeted page relationship.
- Tool is hidden when not on localhost / 127.0.0.1.
- Tool is hidden for non-admin or impersonated non-admin real sessions.
