---
name: page-composer-stable-section-identity
description: >-
  Keep Grime Time's live page composer aligned after reorder by driving selection,
  relation paths, and block motion from stable section identity instead of transient
  layout indexes.
---

# Page Composer Stable Section Identity

## When to use
- The Grime Time page composer can reorder, duplicate, or replace blocks and the live canvas starts targeting the wrong draft slot.
- A block editor still builds relation paths like `layout.${blockIndex}.*` after sections can move.
- Hero/order bugs read like focus jumps, client-side layout-tab crashes, or the hero drifting away from the first slot.

## The pattern
Use stable section identity end to end.

```ts
export function getPageComposerSectionIdentity(args: {
  block: Page['layout'][number]
  index: number
}): string {
  const candidate = args.block as { _uuid?: unknown; id?: unknown }

  if (typeof candidate.id === 'string' && candidate.id.trim()) return `id:${candidate.id}`
  if (typeof candidate.id === 'number' && Number.isFinite(candidate.id)) return `id:${candidate.id}`
  if (typeof candidate._uuid === 'string' && candidate._uuid.trim()) return `uuid:${candidate._uuid}`
  return `index:${args.index}:${args.block.blockType}`
}
```

```ts
const { resolvedBlockIndex } = useResolvedComposerBlockIndex({
  blockIndex,
  sectionIdentity,
})

<InlinePageMediaEditor relationPath={`layout.${resolvedBlockIndex}.media`} />
```

```ts
const nextLayout = movePageLayoutSection({
  fromIndex: findPageLayoutSectionIndexByIdentity({ identity, layout }),
  toIndex,
  layout,
})
```

Also assign `_uuid` when creating or duplicating page-local blocks, and normalize hero back to slot `0` during layout normalization/save.

## Why
The obvious implementation is to let every surface keep using the render-time `blockIndex`. That fails once reorder exists. The drawer, canvas, and inline block editors no longer agree on which `layout[n]` they mean, so move actions look like selection jumps, media edits hit the wrong block, and the hero can be saved in the wrong position. Stable identity lets the UI resolve the current draft index at the last possible moment instead of trusting stale indexes.

## Failure modes
- If a new or duplicated block does not get `_uuid`, the identity falls back to `index:*` and the bug comes back after reorder.
- If the canvas wrapper uses only the live reordered index, tests and DOM anchors lose their stable slot. Keep a stable wrapper index and a separate live action index when needed.
- If live blocks resolve draft state without `sectionIdentity`, relation paths like `layout.${blockIndex}` drift after reorder.
- If hero normalization is skipped during save, a single bad move can poison the persisted layout order.

## Related
- [ERRORS-AND-ATTEMPTS.xml](../ERRORS-AND-ATTEMPTS.xml) attempt `18-06-a1`
- [pageComposer.ts](../../src/lib/pages/pageComposer.ts)
- [useResolvedComposerBlockIndex.ts](../../src/components/page-composer/useResolvedComposerBlockIndex.ts)
