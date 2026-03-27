import type { PortalAccessCta } from '@/lib/email/portalAccessCta'

export function portalAccessHtml(cta: null | PortalAccessCta): string {
  if (!cta) return ''

  const label = cta.mode === 'invite' ? 'Finish your company access' : 'Claim your account'
  return `<p><strong>${label}:</strong> <a href="${cta.link}">Open your secure customer access link</a>. This link expires ${new Date(cta.expiresAt).toLocaleString()}.</p>`
}

export function portalAccessText(cta: null | PortalAccessCta): string {
  if (!cta) return ''

  const label = cta.mode === 'invite' ? 'Finish your company access' : 'Claim your account'
  return `${label}: ${cta.link}\nThis link expires ${new Date(cta.expiresAt).toLocaleString()}.`
}
