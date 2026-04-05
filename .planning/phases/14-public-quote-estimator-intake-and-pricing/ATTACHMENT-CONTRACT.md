# Attachment contract (`14-03`)

## Scope

- Keep estimator uploads optional on `/#instant-quote`.
- Accept a small image batch only: up to 5 files, image MIME types only, 8MB max per file.
- Persist uploads in a dedicated internal Payload collection instead of the public marketing media library.
- Link each attachment to the originating `form-submissions` row immediately, with an optional later link to `quotes`.
- Give staff a first review surface in Payload admin under the Leads group.

## Storage and review path

- Collection: `instant-quote-request-attachments`
- Admin visibility: Leads group, admin-only CRUD via `isAdmin`
- Required metadata:
  - `submission`
  - `attachmentStatus`
  - `intakeSource`
  - `customerFilename`
  - `contentType`
  - `fileSizeBytes`
- Follow-on review fields:
  - `quote`
  - `reviewNotes`

## Validation contract

- Client and server both enforce the same batch policy through `validateInstantQuoteAttachmentBatch(...)`.
- The public route rejects:
  - more than 5 files
  - non-image uploads
  - files larger than 8MB
- No-image submissions remain valid and should follow the existing JSON path without extra upload overhead.

## Implementation notes

- Added collection config at `src/collections/InstantQuoteRequestAttachments.ts`.
- Added shared validation helper at `src/lib/forms/instantQuoteAttachments.ts`.
- Added migration `20260404_193443_add_instant_quote_request_attachments.ts`.
- Generated types include the new collection so later homepage/API work can create attachment rows safely.

## Verification used for this slice

- `npm.cmd run generate:types`
- `npm.cmd run payload migrate`
- `npm.cmd exec vitest run tests/int/lib/forms/instant-quote-request.int.spec.ts tests/int/lib/forms/instant-quote-attachments.int.spec.ts`
- `npm.cmd exec eslint src/lib/forms/instantQuoteAttachments.ts src/collections/InstantQuoteRequestAttachments.ts src/payload.config.ts src/migrations/20260404_193443_add_instant_quote_request_attachments.ts tests/int/lib/forms/instant-quote-attachments.int.spec.ts`
- `npm.cmd run build`
