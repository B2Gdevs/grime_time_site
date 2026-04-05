'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeftIcon, LoaderCircleIcon, RocketIcon, SaveIcon } from 'lucide-react'

import {
  PageComposerBlockSummary,
  PageComposerInlineEditor,
  type PageComposerLayoutBlock,
} from '@/components/admin-impersonation/PageComposerPreview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { SharedSectionPermissions } from '@/lib/auth/sharedSectionPermissions'
import { formatDate } from '@/lib/customers/format'
import {
  unwrapSharedSectionStructureToPageLayoutBlock,
  wrapPageLayoutBlockAsSharedSectionStructure,
} from '@/lib/pages/sharedSectionPageBridge'
import {
  sharedSectionCategoryValues,
  type SharedSectionCategory,
  type SharedSectionRecord,
} from '@/lib/pages/sharedSections'
import { requestJson } from '@/lib/query/request'

const inlineEditableBlockTypes = new Set(['content', 'cta', 'customHtml', 'pricingTable', 'serviceGrid'])

type SaveAction = 'publish-shared-section' | 'save-draft'

type SaveResponse = {
  item: SharedSectionRecord
  permissions: SharedSectionPermissions
}

function formatTokenLabel(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function parseTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ),
  )
}

export function SharedSectionEditor({
  initialItem,
  permissions,
}: {
  initialItem: SharedSectionRecord
  permissions: SharedSectionPermissions
}) {
  const [item, setItem] = useState(initialItem)
  const [notice, setNotice] = useState<null | string>(null)
  const [savingAction, setSavingAction] = useState<null | SaveAction>(null)
  const [tagsInput, setTagsInput] = useState(initialItem.tags.join(', '))

  const editableBlock = useMemo(
    () => unwrapSharedSectionStructureToPageLayoutBlock(item.structure),
    [item.structure],
  )
  const supportsInlineEditing = editableBlock ? inlineEditableBlockTypes.has(editableBlock.blockType) : false

  function updateItem(patch: Partial<SharedSectionRecord>) {
    setItem((current) => ({
      ...current,
      ...patch,
    }))
  }

  function updateBlock(nextBlock: PageComposerLayoutBlock) {
    updateItem({
      structure: wrapPageLayoutBlockAsSharedSectionStructure(nextBlock),
    })
  }

  async function persist(action: SaveAction) {
    setSavingAction(action)
    setNotice(null)

    try {
      const result = await requestJson<SaveResponse>('/api/internal/shared-sections', {
        body: JSON.stringify({
          action,
          category: item.category,
          description: item.description?.trim() || null,
          id: item.id,
          name: item.name.trim(),
          slug: item.slug.trim(),
          structure: item.structure,
          tags: parseTags(tagsInput),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      setItem(result.item)
      setTagsInput(result.item.tags.join(', '))
      setNotice(
        action === 'publish-shared-section'
          ? `Published ${result.item.name}. Linked published pages now resolve version ${result.item.currentVersion}.`
          : `Saved draft for ${result.item.name}.`,
      )
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to save the shared section.')
    } finally {
      setSavingAction(null)
    }
  }

  return (
    <div className="grid gap-6 px-4 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-3">
          <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground" href="/shared-sections">
            <ArrowLeftIcon className="size-4" />
            Back to shared sections
          </Link>
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Shared section source</Badge>
              <Badge variant={item.status === 'published' ? 'secondary' : 'outline'}>{formatTokenLabel(item.status)}</Badge>
              <Badge variant="outline">v{item.currentVersion}</Badge>
              <Badge variant="outline">{formatTokenLabel(item.category)}</Badge>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{item.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Global source editing. Publishing here updates every linked published page that references this section.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button disabled={savingAction !== null || !permissions.canEditDraft} onClick={() => void persist('save-draft')} type="button" variant="outline">
            {savingAction === 'save-draft' ? (
              <>
                <LoaderCircleIcon className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="size-4" />
                Save draft
              </>
            )}
          </Button>
          <Button disabled={savingAction !== null || !permissions.canPublish} onClick={() => void persist('publish-shared-section')} type="button">
            {savingAction === 'publish-shared-section' ? (
              <>
                <LoaderCircleIcon className="size-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <RocketIcon className="size-4" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-foreground">
          <div>
            You are editing a shared section source. Publishing updates {item.usageCount} linked {item.usageCount === 1 ? 'page' : 'pages'}.
          </div>
          <div className="text-muted-foreground">
            Last updated {formatDate(item.updatedAt)}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_24rem]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Source preview</CardTitle>
              <CardDescription>
                This is the canonical shared source block that linked instances resolve against.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editableBlock ? (
                <div className="rounded-[1.75rem] border border-border/70 bg-background/95 p-4 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{editableBlock.blockType}</Badge>
                    <Badge variant="secondary">linked source</Badge>
                  </div>
                  <PageComposerBlockSummary block={editableBlock} label={item.name} />
                </div>
              ) : (
                <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                  This shared section currently uses a structure that does not map cleanly to the single-block source editor yet. Metadata changes can still be saved.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Source editor</CardTitle>
              <CardDescription>
                Local page instances cannot change content. Edit the shared source here, then publish when the update should propagate globally.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {editableBlock && supportsInlineEditing ? (
                <PageComposerInlineEditor block={editableBlock} onUpdate={updateBlock} />
              ) : editableBlock ? (
                <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                  This block type is visible in the shared-section system, but inline source editing has not been expanded for it yet.
                </div>
              ) : (
                <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                  Source editing is limited to shared sections that currently unwrap into a single composer block.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Section details</CardTitle>
              <CardDescription>
                These fields travel with the shared source and appear in the library and publish workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Name</span>
                <Input onChange={(event) => updateItem({ name: event.target.value })} value={item.name} />
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Slug</span>
                <Input onChange={(event) => updateItem({ slug: event.target.value })} value={item.slug} />
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Category</span>
                <Select onValueChange={(value) => updateItem({ category: value as SharedSectionCategory })} value={item.category}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {sharedSectionCategoryValues.map((category) => (
                      <SelectItem key={category} value={category}>
                        {formatTokenLabel(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Tags</span>
                <Input onChange={(event) => setTagsInput(event.target.value)} placeholder="before-after, residential" value={tagsInput} />
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Description</span>
                <Textarea className="min-h-24" onChange={(event) => updateItem({ description: event.target.value })} value={item.description || ''} />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Impact preview</CardTitle>
              <CardDescription>
                Publishing updates linked published pages immediately. Draft pages also resolve the latest published source in v1.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span>Linked page usage</span>
                <span className="font-medium text-foreground">{item.usageCount} {item.usageCount === 1 ? 'page' : 'pages'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Preview status</span>
                <span className="font-medium text-foreground">{formatTokenLabel(item.preview.status)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Published at</span>
                <span className="font-medium text-foreground">{item.publishedAt ? formatDate(item.publishedAt) : 'Not published'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Updated at</span>
                <span className="font-medium text-foreground">{formatDate(item.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          {notice ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">{notice}</CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
