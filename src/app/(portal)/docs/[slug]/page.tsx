import Link from 'next/link'

import { notFound, redirect } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import {
  getPortalDocBySlug,
  getPortalDocs,
  groupPortalDocs,
  readPortalDoc,
} from '@/lib/docs/catalog'

type Props = {
  params: Promise<{
    slug: string
  }>
}

export default async function DocPage({ params }: Props) {
  const auth = await getCurrentAuthContext()
  const user = auth.realUser

  if (!user) {
    return null
  }

  const { slug } = await params
  if (!auth.isRealAdmin) {
    redirect('/')
  }
  const doc = getPortalDocBySlug(slug, { isAdmin: true })

  if (!doc) {
    notFound()
  }

  const docs = getPortalDocs({ isAdmin: true })
  const groupedDocs = groupPortalDocs(docs)
  const content = await readPortalDoc(doc)

  return (
    <>
      <SiteHeader
        title={doc.title}
        description={doc.description}
        actions={
          <Button asChild variant="outline">
            <Link href="/docs">All docs</Link>
          </Button>
        }
      />
      <div className="flex flex-1 flex-col">
        <div className="grid gap-6 px-4 py-6 lg:px-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Browse docs</CardTitle>
              <CardDescription>Docs are grouped by audience and purpose.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {groupedDocs.map((group) => (
                <div className="grid gap-2" key={group.group}>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.group}
                  </h2>
                  {group.docs.map((groupDoc) => (
                    <Link
                      key={groupDoc.slug}
                      href={`/docs/${groupDoc.slug}`}
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted ${
                        groupDoc.slug === doc.slug ? 'bg-muted' : ''
                      }`}
                    >
                      {groupDoc.title}
                    </Link>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <article className="prose prose-slate max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </article>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
