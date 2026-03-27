'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import {
  BookOpenIcon,
  CalendarCheck2Icon,
  CircleDollarSignIcon,
  MenuIcon,
  HomeIcon,
  SearchIcon,
  SparklesIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

function navIconForLabel(label?: null | string) {
  const key = (label || '').toLowerCase()
  if (key.includes('home')) return HomeIcon
  if (key.includes('about')) return BookOpenIcon
  if (key.includes('service')) return SparklesIcon
  if (key.includes('pricing')) return CircleDollarSignIcon
  if (key.includes('book')) return CalendarCheck2Icon
  return SparklesIcon
}

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex items-center gap-1.5">
      <nav className="hidden items-center gap-1 md:flex">
        {navItems.map(({ link }, i) => {
          const Icon = navIconForLabel(link.label)
          return (
            <CMSLink
              key={i}
              {...link}
              appearance="link"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-foreground/85 transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="size-3.5 text-primary/90" />
            </CMSLink>
          )
        })}
      </nav>

      <Link
        className="hidden items-center rounded-lg p-2 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
        href="/search"
      >
        <span className="sr-only">Search</span>
        <SearchIcon className="w-4 text-primary" />
      </Link>

      <div className="flex items-center gap-1 md:hidden">
        <Link
          className="inline-flex items-center rounded-lg p-2 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          href="/search"
        >
          <span className="sr-only">Search</span>
          <SearchIcon className="w-4 text-primary" />
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 rounded-xl border-border/80 bg-background/90"
            >
              <MenuIcon className="size-4 text-primary" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[88vw] max-w-none border-l border-border/80 px-5 py-5 sm:max-w-sm"
          >
            <SheetHeader className="text-left">
              <SheetTitle>Explore Grime Time</SheetTitle>
              <SheetDescription>
                Keep the next step simple on mobile.
              </SheetDescription>
            </SheetHeader>

            <nav className="mt-6 grid gap-2">
              {navItems.map(({ link }, i) => {
                const Icon = navIconForLabel(link.label)
                return (
                  <div key={i} onClick={() => setOpen(false)}>
                    <CMSLink
                      {...link}
                      appearance="link"
                      className="flex w-full items-center justify-start gap-2 rounded-xl border border-border/70 bg-card/70 px-3 py-3 text-left text-sm font-medium text-foreground"
                    >
                      <Icon className="size-4 text-primary/90" />
                    </CMSLink>
                  </div>
                )
              })}

              <Link
                className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/70 px-3 py-3 text-sm font-medium text-foreground"
                href="/search"
                onClick={() => setOpen(false)}
              >
                <SearchIcon className="size-4 text-primary/90" />
                Search the site
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
