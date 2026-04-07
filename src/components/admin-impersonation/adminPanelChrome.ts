/**
 * Shared Tailwind class strings for admin chrome (operator tools, page composer).
 * Extracted to keep surfaces consistent; use `cn(adminPanelChrome.x, extra)` when composing.
 */
export const adminPanelChrome = {
  /** Muted empty-state / placeholder block on `bg-card/50`. */
  panelEmptyMuted:
    'rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground',
  /** Top strip with flex layout (composer toolbar). */
  toolbarRow:
    'flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/50 px-4 py-3',
  /** Dashed drop zone / empty area. */
  panelDashedEmpty:
    'rounded-2xl border border-dashed border-border/70 bg-card/40 px-4 py-8 text-sm text-muted-foreground',
  /** Primary-tinted callout. */
  calloutPrimary:
    'rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground',
  /** Padded card with muted body text. */
  cardMuted: 'rounded-2xl border border-border/70 bg-card/50 p-4 text-sm text-muted-foreground',
  /** Padded card shell (blocks, presets). */
  card: 'rounded-2xl border border-border/70 bg-card/50 p-4',
  /** Empty state on page `background` (e.g. media browser). */
  emptyOnBackground:
    'rounded-2xl border border-border/70 bg-background px-4 py-6 text-sm text-muted-foreground',
  /** Media library row layout. */
  mediaRow:
    'grid gap-3 rounded-2xl border border-border/70 bg-background p-3 md:grid-cols-[5rem_minmax(0,1fr)_auto]',
  /** Nested version row on subtle background. */
  versionNest: 'rounded-2xl border border-border/70 bg-background/70 p-3',
  /** Amber warning panel (block). */
  warnAmber:
    'rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100',
  /** Amber warning inline strip. */
  warnAmberCompact:
    'rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100',
  /** Grid section shell (operator tools cards). */
  panelGrid: 'grid gap-3 rounded-2xl border border-border/70 bg-card/50 p-4',
  /** Compact card (e.g. impersonation summary tiles). */
  cardSm: 'rounded-lg border border-border/70 bg-card/50 p-3',
  /** Media preview frame (clipped). */
  cardOverflowRounded3xl: 'overflow-hidden rounded-3xl border border-border/70 bg-card/50',
  /** Media editor side column / grid cell. */
  cardGridRounded3xl: 'grid gap-3 rounded-3xl border border-border/70 bg-card/50 p-4',
  /** Padded card with 3xl radius (composer media blocks). */
  cardRounded3xlP4: 'rounded-3xl border border-border/70 bg-card/50 p-4',
  /** Muted dashed callout (operator tools empty state). */
  panelDashedMuted:
    'rounded-xl border border-dashed border-border/70 bg-background/50 p-3 text-sm text-muted-foreground',
  /** Tight dashed empty line (search no results). */
  panelDashedEmptyXs: 'rounded-xl border border-dashed p-3 text-xs text-muted-foreground',

  /** Public / private (or similar) segmented control rail — composer admin bar + live canvas toolbar. */
  segmentedControlBar: 'inline-flex h-10 rounded-xl border border-border/70 bg-card/50 p-1',

  /** Drawer top row: title area + actions, items vertically centered. */
  drawerHeaderBetweenCenter: 'flex items-center justify-between gap-4 border-b border-border/70 px-5 py-4',
  /** Drawer top row: title block + actions, top-aligned (e.g. block library, devtools). */
  drawerHeaderBetweenStart: 'flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4',
  /** Strip under header that holds `TabsList` (composer, media devtools). */
  drawerTabsStrip: 'border-b border-border/70 px-5 py-3',
  /** Bottom actions strip in composer tabs. */
  drawerFooterStrip: 'border-t border-border/70 px-5 py-4',

  /** Small icon control on live canvas toolbar (duplicate, link, etc.). */
  canvasToolbarIconButton:
    'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-background/95 text-muted-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground',
  /** Plus control between blocks on the visual canvas. */
  canvasBlockInsertHandle:
    'absolute left-1/2 z-20 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground shadow-lg opacity-0 transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100 data-[selected=true]:opacity-100',

  /** “Add block” glyph in structure list (matches canvas affordance). */
  structureAddCircle:
    'relative inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground shadow-sm transition group-hover:border-primary/40 group-hover:bg-primary/5 group-hover:text-foreground',

  /** Form / section label (12px caps). */
  fieldLabel: 'text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground',
  /** Dense row label (11px caps). */
  fieldLabelTight: 'text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground',
  /** Slightly wider tracking (search labels, footer kickers). */
  fieldLabelWide: 'text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground',
  /** Emphasized small title (media devtools sections). */
  fieldLabelStrong: 'text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground',
  /** Product kicker (“Staff beta”, composer chrome). */
  chromeKicker: 'text-[0.68rem] uppercase tracking-[0.3em] text-muted-foreground',

  /** Copilot: primary-tint soft panel (focused media/text sessions). */
  copilotPrimarySoftPanel: 'rounded-2xl border border-primary/20 bg-primary/5 p-3',
  /** Copilot: muted body inset (draft prompt / current copy). */
  copilotMutedDraftPanel:
    'rounded-2xl border border-border/70 bg-background/80 p-3 text-sm text-muted-foreground',
  /** Copilot authoring: section summary on subtle background. */
  authoringSectionSummary: 'rounded-2xl border border-border/70 bg-background/70 p-3 text-sm',
} as const
