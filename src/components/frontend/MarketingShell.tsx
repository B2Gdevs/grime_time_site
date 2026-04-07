'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpenIcon,
  CircleHelpIcon,
  CompassIcon,
  DropletsIcon,
  FileTextIcon,
  HomeIcon,
  LogInIcon,
  MailIcon,
  ShieldCheckIcon,
  SidebarIcon,
} from 'lucide-react'

import { ClerkCustomerAccessPanel } from '@/components/auth/ClerkCustomerAccessPanel'
import { Logo } from '@/components/Logo/Logo'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { cn } from '@/utilities/ui'
import type { MarketingNavLink } from '@/lib/marketing/public-shell'

type MarketingShellProps = {
  children: React.ReactNode
  footerLinks: MarketingNavLink[]
  primaryLinks: MarketingNavLink[]
}

const FOOTER_ONLY_LABELS = new Set(['about', 'contact'])
const DEFAULT_EXPLORE_LINKS: MarketingNavLink[] = [
  { label: 'Services', href: '/#services', external: false },
  { label: 'Pricing', href: '/#pricing', external: false },
  { label: 'Get quote', href: '/#instant-quote', external: false },
]

function renderLinkIcon(label: string) {
  const key = label.toLowerCase()
  if (key.includes('home')) return <HomeIcon size={16} />
  if (key.includes('quote') || key.includes('service') || key.includes('book')) return <DropletsIcon size={16} />
  if (key.includes('contact')) return <MailIcon size={16} />
  if (key.includes('login') || key.includes('account')) return <LogInIcon size={16} />
  if (key.includes('privacy') || key.includes('terms') || key.includes('refund')) return <FileTextIcon size={16} />
  if (key.includes('support') || key.includes('sla')) return <CircleHelpIcon size={16} />
  if (key.includes('about')) return <BookOpenIcon size={16} />
  return <CompassIcon size={16} />
}

function normalizeHref(href: string) {
  return href.endsWith('/') && href !== '/' ? href.slice(0, -1) : href
}

function normalizeLabel(label: string) {
  return label.trim().toLowerCase()
}

function dedupeLinks(items: MarketingNavLink[]) {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = `${normalizeHref(item.href)}::${normalizeLabel(item.label)}`
    if (seen.has(key)) {
      return false
    }

    if (!item.external && item.href === '/#instant-quote') {
      const quoteKey = 'quote-anchor'
      if (seen.has(quoteKey)) {
        return false
      }
      seen.add(quoteKey)
    }

    seen.add(key)
    return true
  })
}

function buildExploreLinks(primaryLinks: MarketingNavLink[]) {
  const filtered = dedupeLinks(
    primaryLinks.filter((item) => {
      const label = normalizeLabel(item.label)
      if (label === 'home' || FOOTER_ONLY_LABELS.has(label)) {
        return false
      }
      return true
    }),
  )

  return filtered.length > 0 ? filtered : DEFAULT_EXPLORE_LINKS
}

function buildFooterLinks(primaryLinks: MarketingNavLink[], footerLinks: MarketingNavLink[]) {
  const promotedPrimaryLinks = primaryLinks.filter((item) => FOOTER_ONLY_LABELS.has(normalizeLabel(item.label)))
  return dedupeLinks([...promotedPrimaryLinks, ...footerLinks])
}

function isLinkActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/'
  }

  const normalized = href.split('#')[0]
  if (!normalized) {
    return pathname === '/'
  }

  return pathname === normalized || pathname.startsWith(`${normalized}/`)
}

function SidebarLink({
  item,
  pathname,
  compact = false,
  subtle = false,
}: {
  item: MarketingNavLink
  pathname: string
  compact?: boolean
  subtle?: boolean
}) {
  const icon = renderLinkIcon(item.label)
  const active = !item.external && isLinkActive(pathname, item.href)
  const className = cn(
    subtle ? 'text-sidebar-foreground/70 hover:text-sidebar-foreground' : '',
    compact ? 'h-9 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.14em]' : '',
    'border border-transparent data-[active=true]:border-sidebar-ring/40',
  )

  if (item.external) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton tooltip={item.label} className={className} asChild>
          <a href={item.href} target="_blank" rel="noreferrer">
            {icon}
            <span>{item.label}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={item.label} isActive={active} className={className} asChild>
        <Link href={item.href}>
          {icon}
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function MarketingSidebar({
  footerLinks,
  pathname,
  primaryLinks,
}: {
  footerLinks: MarketingNavLink[]
  pathname: string
  primaryLinks: MarketingNavLink[]
}) {
  const exploreLinks = buildExploreLinks(primaryLinks)
  const utilityLinks = buildFooterLinks(primaryLinks, footerLinks)

  return (
    <Sidebar collapsible="icon" className="z-30 border-r border-sidebar-border/80 bg-sidebar/92 backdrop-blur-xl">
      <SidebarHeader className="gap-4 border-b border-sidebar-border/80 p-4">
        <Link href="/" className="flex items-center gap-3 rounded-[1.4rem] py-1 transition-colors hover:bg-sidebar-accent/30">
          <Logo className="shadow-none" />
        </Link>
        <div className="group-data-[collapsible=icon]:hidden">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-sidebar-foreground/55">
            North Texas exterior cleaning
          </p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-sidebar-foreground/78">
            Quotes, scheduling, and service proof in one clear lane.
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent className="marketing-sidebar-scroll px-2 py-3">
        <SidebarGroup className="pt-1">
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {exploreLinks.map((item) => (
                <SidebarLink key={`${item.label}-${item.href}`} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 border-t border-sidebar-border/80 p-4">
        <Link
          href="/#instant-quote"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-sidebar-primary px-4 py-2.5 text-sm font-semibold text-sidebar-primary-foreground transition hover:opacity-90 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0"
        >
          <DropletsIcon className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:sr-only">Get instant quote</span>
        </Link>

        <div className="rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/35 px-3 py-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 text-sm font-medium text-sidebar-foreground">
            <ShieldCheckIcon className="size-4 text-primary" />
            Sign in
          </div>
          <p className="mt-1 text-xs leading-5 text-sidebar-foreground/65">
            Staff and customers both use the same Grime Time Clerk sign-in flow.
          </p>
          <div className="mt-3">
            <ClerkCustomerAccessPanel compact signInFallbackHref="/dashboard" signUpFallbackHref="/dashboard" />
          </div>
        </div>

        {utilityLinks.length > 0 ? (
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs font-medium text-sidebar-foreground/65">
              {utilityLinks.map((item) =>
                item.external ? (
                  <a
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-sidebar-foreground"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    className="transition hover:text-sidebar-foreground"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </div>
          </div>
        ) : null}

        <div className="group-data-[collapsible=icon]:hidden">
          <ThemeSelector />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export function MarketingShell({
  children,
  footerLinks,
  primaryLinks,
}: MarketingShellProps) {
  const pathname = usePathname()

  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          '--sidebar-width': '14.5rem',
          '--sidebar-width-icon': '3.25rem',
        } as CSSProperties
      }
    >
      <MarketingSidebar footerLinks={footerLinks} pathname={pathname} primaryLinks={primaryLinks} />
      <SidebarInset className="min-h-screen bg-background xl:h-[100dvh] xl:overflow-hidden">
        <div className="flex border-b border-border/80 bg-background/92 px-4 py-4 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
            <Link href="/" className="min-w-0">
              <Logo />
            </Link>
            <SidebarTrigger className="shrink-0 border border-border/80 bg-card/80 text-foreground hover:bg-muted">
              <SidebarIcon className="size-4" />
            </SidebarTrigger>
          </div>
        </div>

        <div
          className="flex min-h-screen min-w-0 xl:h-full xl:overflow-hidden"
        >
          <main className="marketing-shell-main marketing-main-scroll flex-1 w-full min-h-screen min-w-0 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain bg-[radial-gradient(circle_at_top,rgba(142,219,62,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,252,0.92))] dark:bg-[radial-gradient(circle_at_top,rgba(142,219,62,0.14),transparent_26%),linear-gradient(180deg,rgba(3,10,17,0.98),rgba(7,19,33,0.96))]">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
