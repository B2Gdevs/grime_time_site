import Link from 'next/link'

import { CalendarClockIcon, FileTextIcon } from 'lucide-react'

import { SectionCards, type SectionCardItem } from '@/components/section-cards'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function CustomerDashboardView({
  cards,
  docs,
}: {
  cards: SectionCardItem[]
  docs: {
    description: string
    slug: string
    title: string
  }[]
}) {
  return (
    <>
      <SiteHeader
        title="Customer dashboard"
        description="Your account overview, scheduling links, and service-day guidance."
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className="@container/main portal-scroll flex min-h-0 flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto overscroll-contain py-4 md:py-6"
          data-portal-scroll=""
        >
          <SectionCards items={cards} />
          <div className="grid min-w-0 gap-4 px-4 lg:px-6 xl:grid-cols-[1.6fr_1fr]">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Customer next steps</CardTitle>
                <CardDescription>
                  Keep the portal lightweight: docs, scheduling, and support first.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button asChild className="justify-start">
                  <Link href="/docs">
                    <FileTextIcon className="size-4" />
                    Open docs
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/schedule">
                    <CalendarClockIcon className="size-4" />
                    Open scheduling
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/contact">Contact the team</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Docs to read</CardTitle>
                <CardDescription>Customer-facing docs stay short and practical.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {docs.map((doc) => (
                  <Link
                    key={doc.slug}
                    href={`/docs/${doc.slug}`}
                    className="rounded-lg border px-3 py-3 transition-colors hover:bg-muted"
                  >
                    <div className="font-medium">{doc.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{doc.description}</div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
