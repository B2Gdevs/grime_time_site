import Link from 'next/link'
import { OPS_DASHBOARD_PATH } from '@/lib/navigation/portalPaths'

export default function AdminOpsDashboardLink() {
  return (
    <div style={{ padding: '0 0.75rem 0.75rem' }}>
      <Link
        href={OPS_DASHBOARD_PATH}
        style={{
          alignItems: 'center',
          background: 'var(--theme-elevation-50)',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: '0.75rem',
          color: 'var(--theme-text)',
          display: 'flex',
          fontSize: '0.95rem',
          fontWeight: 600,
          gap: '0.5rem',
          justifyContent: 'space-between',
          padding: '0.875rem 1rem',
          textDecoration: 'none',
        }}
      >
        <span>Open ops dashboard</span>
        <span aria-hidden>↗</span>
      </Link>
    </div>
  )
}
