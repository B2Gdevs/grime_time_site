import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = ({ className }: Props) => {
  return (
    <div
      aria-label="Grime Time Exterior Cleaning"
      className={clsx(
        'inline-flex min-w-0 items-center rounded-full border border-white/10 bg-[#071321]/95 px-3 py-1.5 text-white shadow-sm',
        className,
      )}
    >
      <div className="grid leading-none">
        <span className="text-[1.05rem] font-black uppercase tracking-[-0.06em] text-white">
          Grime <span className="text-[#8EDB3E]">Time</span>
        </span>
        <span className="text-[0.5rem] font-semibold uppercase tracking-[0.22em] text-white/70">
          Exterior Cleaning
        </span>
      </div>
    </div>
  )
}
