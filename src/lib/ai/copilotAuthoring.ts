import type { CopilotAuthoringContext, CopilotFocusedSession } from '@/lib/ai/types'

function sanitizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function sanitizeInteger(value: unknown): null | number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

export function sanitizeCopilotAuthoringContext(
  value: unknown,
): CopilotAuthoringContext | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as {
    mediaSlot?: unknown
    page?: unknown
    section?: unknown
    surface?: unknown
  }

  if (record.surface !== 'page-composer') {
    return null
  }

  const pageRecord =
    record.page && typeof record.page === 'object'
      ? (record.page as {
          id?: unknown
          pagePath?: unknown
          slug?: unknown
          status?: unknown
          title?: unknown
          visibility?: unknown
        })
      : null
  const pageId = sanitizeInteger(pageRecord?.id)
  const pageTitle = sanitizeText(pageRecord?.title)
  const pageSlug = sanitizeText(pageRecord?.slug)
  const pagePath = sanitizeText(pageRecord?.pagePath)
  const pageStatus = pageRecord?.status === 'published' ? 'published' : 'draft'
  const pageVisibility = pageRecord?.visibility === 'private' ? 'private' : 'public'

  const sectionRecord =
    record.section && typeof record.section === 'object'
      ? (record.section as {
          blockType?: unknown
          description?: unknown
          index?: unknown
          label?: unknown
          variant?: unknown
        })
      : null
  const sectionIndex =
    typeof sectionRecord?.index === 'number' && Number.isInteger(sectionRecord.index) && sectionRecord.index >= 0
      ? sectionRecord.index
      : null
  const sectionLabel = sanitizeText(sectionRecord?.label)
  const sectionBlockType = sanitizeText(sectionRecord?.blockType)

  const mediaRecord =
    record.mediaSlot && typeof record.mediaSlot === 'object'
      ? (record.mediaSlot as {
          label?: unknown
          mediaId?: unknown
          mimeType?: unknown
          relationPath?: unknown
        })
      : null
  const mediaRelationPath = sanitizeText(mediaRecord?.relationPath)
  const mediaLabel = sanitizeText(mediaRecord?.label)
  const mediaId = sanitizeInteger(mediaRecord?.mediaId)

  return {
    mediaSlot:
      mediaRelationPath && mediaLabel
        ? {
            label: mediaLabel,
            mediaId,
            mimeType: sanitizeText(mediaRecord?.mimeType) || null,
            relationPath: mediaRelationPath,
          }
        : null,
    page:
      pageTitle && pageSlug && pagePath
        ? {
          id: pageId,
          pagePath,
          slug: pageSlug,
            status: pageStatus,
            title: pageTitle,
            visibility: pageVisibility,
          }
        : null,
    section:
      sectionIndex !== null && sectionLabel && sectionBlockType
        ? {
            blockType: sectionBlockType,
            description: sanitizeText(sectionRecord?.description),
            index: sectionIndex,
            label: sectionLabel,
            variant: sanitizeText(sectionRecord?.variant) || null,
          }
        : null,
    surface: 'page-composer',
  }
}

export function sanitizeCopilotFocusedSession(
  value: unknown,
): CopilotFocusedSession | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as {
    currentText?: unknown
    fieldLabel?: unknown
    fieldPath?: unknown
    instructions?: unknown
    mode?: unknown
    promptHint?: unknown
    type?: unknown
  }

  if (record.type === 'media-generation') {
    const mode =
      record.mode === 'gallery' || record.mode === 'image' || record.mode === 'video'
        ? record.mode
        : null

    return {
      mode,
      promptHint: sanitizeText(record.promptHint) || undefined,
      type: 'media-generation',
    }
  }

  if (record.type === 'text-generation') {
    const fieldLabel = sanitizeText(record.fieldLabel)
    const fieldPath = sanitizeText(record.fieldPath)

    if (!fieldLabel || !fieldPath) {
      return null
    }

    return {
      currentText: sanitizeText(record.currentText) || undefined,
      fieldLabel,
      fieldPath,
      instructions: sanitizeText(record.instructions) || undefined,
      type: 'text-generation',
    }
  }

  return null
}

export function buildCopilotAuthoringSystemMessage(args: {
  authoringContext?: CopilotAuthoringContext | null
  focusedSession?: CopilotFocusedSession | null
}): null | string {
  const lines: string[] = []

  if (args.authoringContext?.surface === 'page-composer') {
    lines.push('Active authoring surface: page composer')

    if (args.authoringContext.page) {
      lines.push(`Page: ${args.authoringContext.page.title} (${args.authoringContext.page.pagePath})`)
      lines.push(`Page status: ${args.authoringContext.page.status}; visibility: ${args.authoringContext.page.visibility}`)
    }

    if (args.authoringContext.section) {
      const variantSuffix = args.authoringContext.section.variant
        ? `; variant: ${args.authoringContext.section.variant}`
        : ''
      lines.push(
        `Selected section: #${args.authoringContext.section.index + 1} ${args.authoringContext.section.label} (${args.authoringContext.section.blockType}${variantSuffix})`,
      )
      if (args.authoringContext.section.description) {
        lines.push(`Section summary: ${args.authoringContext.section.description}`)
      }
    }

    if (args.authoringContext.mediaSlot) {
      lines.push(
        `Selected media slot: ${args.authoringContext.mediaSlot.label} at ${args.authoringContext.mediaSlot.relationPath}`,
      )
      if (args.authoringContext.mediaSlot.mimeType) {
        lines.push(`Current media kind: ${args.authoringContext.mediaSlot.mimeType}`)
      }
    }
  }

  if (args.focusedSession?.type === 'media-generation') {
    lines.push('Focused session: media generation')
    lines.push(
      args.focusedSession.mode
        ? `Focused generation mode: ${args.focusedSession.mode}`
        : 'Focused generation mode is not selected yet. Ask the operator to choose image, video, or gallery before generation guidance.',
    )
    if (args.focusedSession.promptHint) {
      lines.push(`Current prompt draft: ${args.focusedSession.promptHint}`)
    }
  }

  if (args.focusedSession?.type === 'text-generation') {
    lines.push('Focused session: text generation')
    lines.push(`Target field: ${args.focusedSession.fieldLabel} at ${args.focusedSession.fieldPath}`)
    if (args.focusedSession.instructions) {
      lines.push(`Rewrite goal: ${args.focusedSession.instructions}`)
    }
    if (args.focusedSession.currentText) {
      lines.push(`Current field text: ${args.focusedSession.currentText}`)
    }
  }

  return lines.length ? lines.join('\n') : null
}
