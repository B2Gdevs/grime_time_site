import { cn } from '@/utilities/ui'

type NoiseBackgroundProps = {
  className?: string
  contrast?: 'dark' | 'light'
}

export function NoiseBackground({ className, contrast = 'dark' }: NoiseBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]',
        contrast === 'dark' ? 'noise-ambient-dark' : 'noise-ambient-light',
        className,
      )}
    >
      <div className="noise-grid absolute inset-0" />
      <div className="noise-orb absolute -left-16 top-0 h-48 w-48 rounded-full bg-primary/14 blur-3xl" />
      <div className="noise-orb noise-orb-delayed absolute right-0 top-8 h-64 w-64 rounded-full bg-secondary/12 blur-3xl" />
      <div className="noise-film absolute inset-0 opacity-55" />
      <div className="noise-lines absolute inset-x-0 top-0 h-px opacity-70" />
    </div>
  )
}
