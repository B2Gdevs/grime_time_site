'use client'

/**
 * Legacy entry: the draggable launcher now mounts from {@link PageComposerDrawer} (`@/components/page-composer/PageComposerDrawer`) so it shares the
 * same `enabled` gate. Kept as a no-op for older layouts that still import this name.
 */
export function ContentAuthoringToolbar() {
  return null
}
