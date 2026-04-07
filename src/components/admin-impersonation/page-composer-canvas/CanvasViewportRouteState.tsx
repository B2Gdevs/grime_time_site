'use client'

export function CanvasViewportRouteState({
  toolbarState,
}: {
  toolbarState: {
    draftPage?: null | {
      id?: null | number
    }
    loading: boolean
  }
}) {
  return (
    <div className="flex h-10 min-w-0 flex-[1_1_16rem] items-center rounded-xl border border-input bg-background px-3 text-sm text-muted-foreground">
      {toolbarState.loading
        ? 'Loading current route...'
        : toolbarState.draftPage
          ? toolbarState.draftPage.id
            ? 'Editing the page document for this route.'
            : 'This route does not have a page yet. Save draft or publish to create it.'
          : 'No page loaded yet'}
    </div>
  )
}
