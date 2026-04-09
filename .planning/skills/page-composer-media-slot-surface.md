---
name: page-composer-media-slot-surface
description: >-
  Restore and verify the Grime Time page-composer media tab when slot-focused
  actions disappear behind a simplified library UI. Use this when browser tests
  fail around media replacement or focused copilot because the selected-slot
  surface is no longer mounted or the spec assumes the wrong feature flags.
---

# Page composer media slot surface

## When to use
- The page-composer Media tab only shows the global library and browser tests fail on slot-targeted actions.
- A selected media slot exists, but `Generate and swap`, `Upload and swap`, or `Focused copilot` are missing.
- E2E coverage is asserting old toast text or ignores the feature flags that gate focused media generation.

## The pattern
```tsx
{mediaSlots.length ? (
  <PageComposerDrawerMediaSlotList
    mediaSlots={mediaSlots}
    selectedMediaSlot={selectedMediaSlot}
    setMediaKind={setMediaKind}
    setSelectedMediaPath={setSelectedMediaPath}
  />
) : null}

{selectedMediaSlot ? (
  <>
    <PageComposerDrawerMediaSelectedSlotDetails
      mediaKind={mediaKind}
      selectedMediaSlot={selectedMediaSlot}
      setMediaKind={setMediaKind}
    />
    <PageComposerDrawerMediaSelectedSlotPreview selectedMediaSlot={selectedMediaSlot} />
    <PageComposerDrawerMediaUploadGenerateCard
      copilot={copilot}
      loadMediaLibrary={loadMediaLibrary}
      mediaActionsLocked={mediaActionsLocked}
      mediaKind={mediaKind}
      mediaLoading={mediaLoading}
      mediaPrompt={mediaPrompt}
      mediaPromptId={mediaPromptId}
      mediaUploadInputRef={mediaUploadInputRef}
      selectedMediaSlot={selectedMediaSlot}
      setMediaPrompt={setMediaPrompt}
      submitMediaAction={submitMediaAction}
      submittingMediaAction={submittingMediaAction}
    />
  </>
) : null}
```

```ts
const copilotEnabled = process.env.AI_OPS_ASSISTANT_ENABLED === 'true'
const focusedMediaCopilotEnabled =
  process.env.NEXT_PUBLIC_COPILOT_MEDIA_GENERATION_ENABLED === 'true'

test.skip(
  !copilotEnabled || !focusedMediaCopilotEnabled,
  'Enable both flags to run the focused media copilot flow.',
)
```

## Why
The simplified library-only media tab leaves real selected-slot behavior orphaned even though the slot-focused components and route actions still exist. That creates a false split where the product loses page-local media replacement affordances and the browser tests start guessing at labels or waiting for messages that are no longer rendered. Mount the slot-focused surface explicitly whenever `selectedMediaSlot` exists, and keep the tests aligned to the actual contract: accessible slot labels, request dispatch, prompt reset, and the real feature flags.

## Failure modes
- If slot buttons do not expose stable accessible names, Playwright falls back to brittle structural selectors. Add `aria-label={slot.label}` on slot-list buttons.
- If the test only checks `AI_OPS_ASSISTANT_ENABLED`, the focused-copilot spec runs in environments where the media-generation control is intentionally hidden.
- If the spec waits for success toast text, it can fail even when the action succeeded because `submitMediaAction` currently clears prompt state and refreshes data but does not surface the success string in visible UI.

## Related
- `page-composer-stable-section-identity`
