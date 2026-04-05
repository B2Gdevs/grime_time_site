'use client'

import Link from 'next/link'
import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Layers3Icon, PlusIcon, RefreshCcwIcon, SearchIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { SharedSectionPermissions } from '@/lib/auth/sharedSectionPermissions'
import { formatDate } from '@/lib/customers/format'
import {
  sharedSectionCategoryValues,
  type SharedSectionCategory,
  type SharedSectionRecord,
} from '@/lib/pages/sharedSections'
import { queryKeys } from '@/lib/query/queryKeys'
import { requestJson } from '@/lib/query/request'

type SharedSectionsLibraryData = {
  items: SharedSectionRecord[]
  permissions: SharedSectionPermissions
}

type SharedSectionCreateDraft = {
  category: SharedSectionCategory
  description: string
  name: string
  tags: string
}

const emptyCreateDraft = (): SharedSectionCreateDraft => ({
  category: 'content',
  description: '',
  name: '',
  tags: '',
})

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

async function fetchSharedSections(args: {
  category: string
  search: string
}): Promise<SharedSectionsLibraryData> {
  const params = new URLSearchParams()

  if (args.category !== 'all') {
    params.set('category', args.category)
  }

  if (args.search.trim()) {
    params.set('search', args.search.trim())
  }

  return requestJson<SharedSectionsLibraryData>(
    `/api/internal/shared-sections${params.size > 0 ? `?${params.toString()}` : ''}`,
    {
      cache: 'no-store',
    },
  )
}

export function SharedSectionsLibrary({ initialData }: { initialData: SharedSectionsLibraryData }) {
  const queryClient = useQueryClient()
  const [createDraft, setCreateDraft] = React.useState<SharedSectionCreateDraft>(emptyCreateDraft)
  const [notice, setNotice] = React.useState<null | string>(null)
  const [searchValue, setSearchValue] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<'all' | SharedSectionCategory>('all')
  const deferredSearchValue = React.useDeferredValue(searchValue)
  const normalizedSearch = deferredSearchValue.trim()

  const libraryQuery = useQuery({
    initialData,
    placeholderData: (previous) => previous,
    queryFn: () =>
      fetchSharedSections({
        category: selectedCategory,
        search: normalizedSearch,
      }),
    queryKey: queryKeys.sharedSectionsLibrary({
      category: selectedCategory,
      search: normalizedSearch,
    }),
  })

  const createMutation = useMutation({
    mutationFn: async () =>
      requestJson<{ item: SharedSectionRecord; permissions: SharedSectionPermissions }>('/api/internal/shared-sections', {
        body: JSON.stringify({
          action: 'create-shared-section',
          category: createDraft.category,
          description: createDraft.description.trim() || null,
          name: createDraft.name.trim(),
          tags: parseTags(createDraft.tags),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : 'Unable to create the shared section.')
    },
    onSuccess: async (result) => {
      setNotice(`Created ${result.item.name}.`)
      setCreateDraft(emptyCreateDraft())
      await queryClient.invalidateQueries({
        queryKey: ['shared-sections-library'],
      })
    },
  })

  const items = libraryQuery.data.items
  const publishedCount = items.filter((item) => item.status === 'published').length
  const pendingPreviewCount = items.filter((item) => item.preview.status === 'pending').length

  return (
    <div className="grid gap-4 px-4 lg:px-6">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Library size</CardDescription>
            <CardTitle className="text-2xl">{items.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Shared sections available for linked reuse across service and location pages.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Published sources</CardDescription>
            <CardTitle className="text-2xl">{publishedCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Sources currently ready to propagate into linked page instances.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Preview backlog</CardDescription>
            <CardTitle className="text-2xl">{pendingPreviewCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Shared sections waiting on preview regeneration after structure changes.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PlusIcon className="size-4" />
              Create shared section
            </CardTitle>
            <CardDescription>
              Shared sections are created in the library first, then linked into page layouts.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Name</span>
              <Input
                onChange={(event) => setCreateDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Homepage hero"
                value={createDraft.name}
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Category</span>
              <Select
                onValueChange={(value) =>
                  setCreateDraft((current) => ({ ...current, category: value as SharedSectionCategory }))
                }
                value={createDraft.category}
              >
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
              <Input
                onChange={(event) => setCreateDraft((current) => ({ ...current, tags: event.target.value }))}
                placeholder="before-after, residential"
                value={createDraft.tags}
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Description</span>
              <Textarea
                className="min-h-24"
                onChange={(event) => setCreateDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="Reusable source for the primary service proof band."
                value={createDraft.description}
              />
            </label>

            <Button
              className="justify-self-start"
              disabled={createMutation.isPending || !createDraft.name.trim()}
              onClick={() => createMutation.mutate()}
              type="button"
            >
              {createMutation.isPending ? 'Creating…' : 'Create shared section'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers3Icon className="size-4" />
                  Shared section library
                </CardTitle>
                <CardDescription>
                  Filter by category, review usage counts, and jump straight into the dedicated source editor.
                </CardDescription>
              </div>
              <Button
                className="shrink-0"
                disabled={libraryQuery.isFetching}
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ['shared-sections-library'],
                  })
                }
                size="sm"
                type="button"
                variant="outline"
              >
                <RefreshCcwIcon className="size-3.5" />
                Refresh
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem]">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Search</span>
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Search name, slug, or description"
                    value={searchValue}
                  />
                </div>
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Category</span>
                <Select
                  onValueChange={(value) => setSelectedCategory(value as 'all' | SharedSectionCategory)}
                  value={selectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {sharedSectionCategoryValues.map((category) => (
                      <SelectItem key={category} value={category}>
                        {formatTokenLabel(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
          </CardHeader>

          <CardContent className="grid gap-4">
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
                No shared sections match the current filters yet.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {items.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-2xl border p-4">
                    <div className="flex min-h-28 items-end rounded-xl border bg-muted/30 p-3">
                      <div className="grid gap-1">
                        <Badge variant={item.preview.status === 'ready' ? 'secondary' : 'outline'}>
                          Preview {formatTokenLabel(item.preview.status)}
                        </Badge>
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.preview.url ? 'Preview asset attached.' : 'Preview image pending or unavailable.'}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={item.status === 'published' ? 'secondary' : 'outline'}>
                          {formatTokenLabel(item.status)}
                        </Badge>
                        <Badge variant="outline">{formatTokenLabel(item.category)}</Badge>
                        <Badge variant="outline">v{item.currentVersion}</Badge>
                      </div>

                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.description || 'No description added yet.'}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.length > 0 ? (
                          item.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            No tags
                          </Badge>
                        )}
                      </div>
                    </div>

                    <dl className="grid gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between gap-3">
                        <dt>Slug</dt>
                        <dd className="max-w-[65%] truncate font-medium text-foreground">{item.slug}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt>Used on</dt>
                        <dd className="font-medium text-foreground">
                          {item.usageCount} {item.usageCount === 1 ? 'page' : 'pages'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt>Updated</dt>
                        <dd className="font-medium text-foreground">{formatDate(item.updatedAt)}</dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" type="button" variant="outline">
                        <Link href={`/shared-sections/${item.id}/edit`}>Edit source</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {notice ? <div className="text-sm text-muted-foreground">{notice}</div> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
