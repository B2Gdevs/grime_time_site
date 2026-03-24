'use client'

import { useEffect, useRef } from 'react'

import { cn } from '@/utilities/ui'

type Bubble = {
  drift: number
  opacity: number
  size: number
  speed: number
  x: number
  y: number
}

type BubbleBackgroundProps = {
  className?: string
  density?: number
  speed?: number
}

export function BubbleBackground({
  className,
  density = 28,
  speed = 1,
}: BubbleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!canvas || !container) return

    const context = canvas.getContext('2d')

    if (!context) return

    let animationFrame = 0
    let tick = 0
    let width = 0
    let height = 0

    const particles: Bubble[] = Array.from({ length: density }, () => ({
      drift: Math.random() * Math.PI * 2,
      opacity: 0.14 + Math.random() * 0.16,
      size: 3 + Math.random() * 18,
      speed: 0.35 + Math.random() * 0.6,
      x: 0,
      y: 0,
    }))

    const resetParticle = (bubble: Bubble, initial = false) => {
      bubble.x = Math.random() * width
      bubble.y = initial ? Math.random() * height : height + bubble.size + Math.random() * 40
    }

    const resize = () => {
      const bounds = container.getBoundingClientRect()
      width = bounds.width
      height = bounds.height
      canvas.width = width
      canvas.height = height

      particles.forEach((bubble, index) => {
        resetParticle(bubble, index % 2 === 0)
      })
    }

    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(container)

    const animate = () => {
      tick += 0.015 * speed
      context.clearRect(0, 0, width, height)

      particles.forEach((bubble) => {
        bubble.y -= bubble.speed * speed
        bubble.x += Math.sin(tick + bubble.drift) * 0.35

        if (bubble.y < -bubble.size - 24) {
          resetParticle(bubble)
        }

        context.beginPath()
        context.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
        context.fillStyle = `rgba(0, 0, 0, ${bubble.opacity})`
        context.fill()
      })

      animationFrame = window.requestAnimationFrame(animate)
    }

    animationFrame = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      observer.disconnect()
    }
  }, [density, speed])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.05),transparent_32%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}
