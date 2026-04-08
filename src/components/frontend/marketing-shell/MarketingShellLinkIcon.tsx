'use client'

import {
  BookOpenIcon,
  CircleHelpIcon,
  CompassIcon,
  DropletsIcon,
  FileTextIcon,
  HomeIcon,
  LogInIcon,
  MailIcon,
} from 'lucide-react'

export function MarketingShellLinkIcon({ label }: { label: string }) {
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
