/**
 * Copilot focused "media generation" session (workbench, composer/canvas handoff).
 * Off by default until in-chat UX and render targets are defined.
 *
 * Enable locally: `NEXT_PUBLIC_COPILOT_MEDIA_GENERATION_ENABLED=true`
 */
export const COPILOT_MEDIA_GENERATION_ENABLED =
  process.env.NEXT_PUBLIC_COPILOT_MEDIA_GENERATION_ENABLED === 'true'
