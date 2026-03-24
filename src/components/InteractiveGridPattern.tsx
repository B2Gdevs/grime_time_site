'use client'

import React, { useState } from 'react'

import { cn } from '@/utilities/ui'

interface InteractiveGridPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  squares?: [number, number]
  squaresClassName?: string
}

export function InteractiveGridPattern({
  width = 52,
  height = 52,
  squares = [24, 14],
  className,
  squaresClassName,
  ...props
}: InteractiveGridPatternProps) {
  const [horizontal, vertical] = squares
  const [hoveredSquare, setHoveredSquare] = useState<number | null>(null)

  return (
    <svg
      width={width * horizontal}
      height={height * vertical}
      className={cn('absolute inset-0 h-full w-full', className)}
      {...props}
    >
      {Array.from({ length: horizontal * vertical }).map((_, index) => {
        const x = (index % horizontal) * width
        const y = Math.floor(index / horizontal) * height

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={width}
            height={height}
            className={cn(
              'fill-transparent stroke-white/12 transition-all duration-150 ease-out not-[&:hover]:duration-1000',
              hoveredSquare === index ? 'fill-white/12 stroke-primary/40' : '',
              squaresClassName,
            )}
            onMouseEnter={() => setHoveredSquare(index)}
            onMouseLeave={() => setHoveredSquare(null)}
          />
        )
      })}
    </svg>
  )
}
