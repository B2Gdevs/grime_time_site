import Link from 'next/link'

/**
 * Separates customer sign-in (this page) from staff surfaces (`/admin` CMS, `/portal` team app).
 */
export function StaffLoginHint() {
  return (
    <div className="rounded-xl border border-border bg-card/60 px-4 py-4 text-center text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Staff &amp; operators</p>
      <p className="mt-2 text-balance">
        <span className="text-foreground">CMS &amp; configuration:</span>{' '}
        <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/admin">
          Payload admin
        </Link>
        .{' '}
        <span className="text-foreground">Day-to-day ops:</span> team sign-in routes to{' '}
        <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/portal">
          /portal
        </Link>{' '}
        and{' '}
        <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/ops">
          /ops
        </Link>{' '}
        (staff access — not the customer card above).
      </p>
    </div>
  )
}
