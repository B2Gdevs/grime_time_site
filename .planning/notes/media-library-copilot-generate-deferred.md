# Media library: copilot generate → apply to record (deferred)

**Status:** Not implemented. The media tab **Generate** action only:

1. Sets `CopilotAuthoringContext` with `surface: 'media-library'` and `libraryMedia: { id, label, mimeType }`.
2. Optionally includes the open draft page when present (orientation for the operator).
3. Calls `openFocusedMediaSession({ mode: 'image', promptHint })` so the Portal Copilot opens a focused image session.

**Future work (full loop):**

1. User iterates in chat until a candidate image (or asset URL) is acceptable.
2. **Confirm** action in UI (or copilot tool) calls an API that **replaces the file** for the existing `media` row `libraryMedia.id` (same pattern as `replace-existing` / upload-by-id), then refreshes the library.
3. Edge cases: mime type changes, video vs image, permissions, and undo.

Until then, operators can generate in chat and manually upload via **Replace** on the card if needed.
