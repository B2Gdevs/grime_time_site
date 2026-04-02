import Link from 'next/link'

/**
 * Separates customer sign-in from the staff/operator lanes that open after the hosted login succeeds.
 */
export function StaffLoginHint() {
  return (
    <div className="rounded-xl border border-border bg-card/60 px-4 py-4 text-center text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Staff &amp; operators</p>
      <p className="mt-2 text-balance">
        Team access starts with the hosted Grime Time sign-in on this page. After sign-in, open{' '}
        <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/ops">
          /ops
        </Link>{' '}
        for day-to-day work,{' '}
        <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/portal">
          /portal
        </Link>{' '}
        for the shared app shell, and{' '}
        <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/admin">
          Payload admin
        </Link>{' '}
        for CMS and configuration.
      </p>
    </div>
  )
}
