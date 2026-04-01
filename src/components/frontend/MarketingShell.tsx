'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpenIcon,
  CircleHelpIcon,
  CompassIcon,
  FileTextIcon,
  HomeIcon,
  LogInIcon,
  MailIcon,
  SearchIcon,
  ShieldCheckIcon,
  SidebarIcon,
  SparklesIcon,
} from 'lucide-react'

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

const quickLinks: MarketingNavLink[] = [
  { label: 'Get instant quote', href: '/#instant-quote', external: false },
  { label: 'Customer login', href: '/login', external: false },
  { label: 'Search', href: '/search', external: false },
]

const spotlightLinks: MarketingNavLink[] = [
  { label: 'Home', href: '/', external: false },
  { label: 'Services', href: '/#services', external: false },
  { label: 'Pricing', href: '/#pricing', external: false },
  { label: 'Contact', href: '/contact', external: false },
]

function iconForLink(label: string) {
  const key = label.toLowerCase()
  if (key.includes('home')) return HomeIcon
  if (key.includes('quote') || key.includes('service')) return SparklesIcon
  if (key.includes('contact')) return MailIcon
  if (key.includes('login') || key.includes('account')) return LogInIcon
  if (key.includes('privacy') || key.includes('terms') || key.includes('refund')) return FileTextIcon
  if (key.includes('support') || key.includes('sla')) return CircleHelpIcon
  if (key.includes('about')) return BookOpenIcon
  if (key.includes('search')) return SearchIcon
  return CompassIcon
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
  const Icon = iconForLink(item.label)
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
            <Icon size={16} />
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
          <Icon size={16} />
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
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/80 bg-sidebar/92 backdrop-blur-xl">
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

          <div className="mt-4 flex flex-wrap gap-2">
            {spotlightLinks.map((item) => (
              <SidebarLink
                key={`${item.label}-${item.href}`}
                item={item}
                pathname={pathname}
                compact
              />
            ))}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel>Quick start</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {quickLinks.map((item) => (
                <SidebarLink key={item.href} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {primaryLinks.map((item) => (
                <SidebarLink key={`${item.label}-${item.href}`} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {footerLinks.length > 0 ? (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Support</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {footerLinks.map((item) => (
                  <SidebarLink key={`${item.label}-${item.href}`} item={item} pathname={pathname} subtle />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="gap-3 border-t border-sidebar-border/80 p-4">
        <Link
          href="/#instant-quote"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-sidebar-primary px-4 py-2.5 text-sm font-semibold text-sidebar-primary-foreground transition hover:opacity-90 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0"
        >
          <SparklesIcon className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:sr-only">Get instant quote</span>
        </Link>

        <div className="rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/35 px-3 py-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 text-sm font-medium text-sidebar-foreground">
            <ShieldCheckIcon className="size-4 text-primary" />
            Customer access
          </div>
          <p className="mt-1 text-xs leading-5 text-sidebar-foreground/65">
            Returning customers can review estimates, invoices, and scheduling from one account.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
          >
            Sign in
            <LogInIcon className="size-4" />
          </Link>
        </div>

        <div className="group-data-[collapsible=icon]:hidden">
          <ThemeSelector />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export function MarketingShell({ children, footerLinks, primaryLinks }: MarketingShellProps) {
  const pathname = usePathname()

  return (
    <SidebarProvider defaultOpen>
      <MarketingSidebar footerLinks={footerLinks} pathname={pathname} primaryLinks={primaryLinks} />
      <SidebarInset className="min-h-screen bg-background">
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

        <main className="marketing-shell-main min-h-screen bg-[radial-gradient(circle_at_top,rgba(142,219,62,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,252,0.92))] dark:bg-[radial-gradient(circle_at_top,rgba(142,219,62,0.14),transparent_26%),linear-gradient(180deg,rgba(3,10,17,0.98),rgba(7,19,33,0.96))]">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
