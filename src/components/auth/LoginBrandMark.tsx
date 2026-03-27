import Link from 'next/link'
import { Droplets } from 'lucide-react'

export function LoginBrandMark() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 self-center text-sm font-medium text-foreground hover:opacity-90"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Droplets className="size-4" aria-hidden />
      </div>
      Grime Time
    </Link>
  )
}
