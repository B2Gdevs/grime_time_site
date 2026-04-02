import Link from 'next/link'

import { redirect } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { SiteHeader } from '@/components/site-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { groupPortalDocs, readPortalDoc, getPortalDocs } from '@/lib/docs/catalog'

export default async function DocsIndexPage() {
  const auth = await getCurrentAuthContext()
  const user = auth.realUser

  if (!user) {
    return null
  }

  if (!auth.isRealAdmin) {
    redirect('/')
  }
  const docs = getPortalDocs({ isAdmin: true })
  const groupedDocs = groupPortalDocs(docs)
  const featured = docs.find((doc) => doc.audience === 'admin') ?? docs[0]
  const featuredBody = featured ? await readPortalDoc(featured) : ''

  return (
    <>
      <SiteHeader
        title="Docs"
        description="Internal playbooks plus the customer-facing help content."
      />
      <div className="flex flex-1 flex-col">
        <div className="grid gap-6 px-4 py-6 lg:px-6 xl:grid-cols-[1.1fr_1.9fr]">
          <Card data-tour="portal-docs-index">
            <CardHeader>
              <CardTitle>Available guides</CardTitle>
              <CardDescription>Choose a document to open it in the docs reader.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {groupedDocs.map((group) => (
                <div className="grid gap-2" key={group.group}>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.group}
                  </h2>
                  {group.docs.map((doc) => (
                    <Link
                      key={doc.slug}
                      href={`/docs/${doc.slug}`}
                      className="rounded-lg border px-3 py-3 transition-colors hover:bg-muted"
                    >
                      <div className="font-medium">{doc.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{doc.description}</div>
                    </Link>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card data-tour="portal-docs-reader">
            <CardHeader>
              <CardTitle>{featured?.title ?? 'No docs yet'}</CardTitle>
              <CardDescription>
                {featured?.description ?? 'Add docs to the catalog to populate this area.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <article className="prose prose-slate max-h-[70vh] max-w-none overflow-auto rounded-lg bg-muted/40 p-4 dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{featuredBody}</ReactMarkdown>
              </article>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
