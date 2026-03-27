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
        'inline-flex min-w-0 items-center gap-1.5 rounded-full border border-white/15 bg-[#071321]/95 px-2.5 py-1.5 text-white shadow-sm sm:gap-2 sm:px-3',
        className,
      )}
    >
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#8EDB3E] text-[9px] font-black tracking-tight text-[#071321] sm:size-6 sm:text-[10px]">
        GT
      </span>
      <div className="grid leading-none">
        <span className="text-[0.92rem] font-black uppercase tracking-[-0.06em] text-white sm:text-[1.05rem]">
          Grime <span className="text-[#8EDB3E]">Time</span>
        </span>
        <span className="text-[0.42rem] font-semibold uppercase tracking-[0.18em] text-white/70 sm:text-[0.5rem] sm:tracking-[0.22em]">
          Exterior Cleaning
        </span>
      </div>
    </div>
  )
}
