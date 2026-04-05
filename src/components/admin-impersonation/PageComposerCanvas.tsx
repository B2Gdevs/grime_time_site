'use client'

import { SmartphoneIcon, TabletSmartphoneIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { usePageComposerOptional, type PageComposerCanvasMode } from '@/components/admin-impersonation/PageComposerContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

function canvasFrameClassName(mode: PageComposerCanvasMode) {
  if (mode === 'mobile') {
    return 'mx-auto w-full max-w-[26rem]'
  }

  if (mode === 'tablet') {
    return 'mx-auto w-full max-w-[52rem]'
  }

  return 'w-full'
}

function CanvasModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <Button onClick={onClick} size="sm" type="button" variant={active ? 'default' : 'outline'}>
      {children}
    </Button>
  )
}

export function PageComposerCanvasViewport({ children }: { children: React.ReactNode }) {
  const composer = usePageComposerOptional()
  const pathname = usePathname()

  const isActive = Boolean(
    composer?.isOpen && composer.activePagePath && composer.activePagePath === pathname,
  )

  if (!composer || !isActive) {
    return <>{children}</>
  }

  return (
    <div className="page-composer-canvas min-w-0">
      <div className="sticky top-[calc(var(--portal-sticky-top)+0.75rem)] z-40 mb-4 flex justify-center px-4">
        <div className="flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-border/70 bg-background/94 px-4 py-3 shadow-xl backdrop-blur">
          <div>
            <div className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Live canvas
            </div>
            <div className="mt-1 text-sm text-foreground">
              Click a section on the page to inspect it in the composer.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <CanvasModeButton
              active={composer.previewMode === 'desktop'}
              onClick={() => composer.setPreviewMode('desktop')}
            >
              Desktop
            </CanvasModeButton>
            <CanvasModeButton
              active={composer.previewMode === 'tablet'}
              onClick={() => composer.setPreviewMode('tablet')}
            >
              <TabletSmartphoneIcon className="h-4 w-4" />
              Tablet
            </CanvasModeButton>
            <CanvasModeButton
              active={composer.previewMode === 'mobile'}
              onClick={() => composer.setPreviewMode('mobile')}
            >
              <SmartphoneIcon className="h-4 w-4" />
              Mobile
            </CanvasModeButton>
          </div>
        </div>
      </div>

      <div className={canvasFrameClassName(composer.previewMode)}>{children}</div>
    </div>
  )
}

export function PageComposerCanvasSection({
  children,
  index,
  label,
}: {
  children: React.ReactNode
  index: number
  label: string
}) {
  const composer = usePageComposerOptional()
  const pathname = usePathname()
  const sectionRef = useRef<HTMLDivElement | null>(null)

  const isActive = Boolean(
    composer?.isOpen && composer.activePagePath && composer.activePagePath === pathname,
  )
  const isSelected = Boolean(isActive && composer?.selectedIndex === index)

  useEffect(() => {
    if (!isSelected) {
      return
    }

    if (typeof sectionRef.current?.scrollIntoView === 'function') {
      sectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [isSelected])

  if (!composer || !isActive) {
    return <>{children}</>
  }

  return (
    <div
      ref={sectionRef}
      className={cn(
        'group relative rounded-[1.6rem] transition',
        isSelected ? 'ring-2 ring-primary/40 ring-offset-4 ring-offset-background' : 'hover:ring-2 hover:ring-primary/20 hover:ring-offset-4 hover:ring-offset-background',
      )}
      data-page-composer-block-index={index}
      data-page-composer-selected={isSelected ? 'true' : 'false'}
      onClickCapture={(event) => {
        event.preventDefault()
        event.stopPropagation()
        composer.setSelectedIndex(index)
      }}
    >
      <div
        className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full border border-border/70 bg-background/94 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-foreground shadow-lg opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-within:opacity-100 data-[selected=true]:opacity-100"
        data-selected={isSelected ? 'true' : 'false'}
      >
        <span className="text-primary">Section {index + 1}</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground">{label}</span>
      </div>

      <div data-selected={isSelected ? 'true' : 'false'}>{children}</div>
    </div>
  )
}
