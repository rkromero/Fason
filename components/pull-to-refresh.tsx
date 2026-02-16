"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: React.ReactNode
  className?: string
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const isPulling = useRef(false)

  const THRESHOLD = 60
  const MAX_PULL = 100

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const el = containerRef.current
    if (!el || el.scrollTop > 0) return

    startY.current = e.touches[0].clientY
    isPulling.current = true
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || refreshing) return

    const el = containerRef.current
    if (!el || el.scrollTop > 0) {
      isPulling.current = false
      setPullDistance(0)
      setPulling(false)
      return
    }

    const y = e.touches[0].clientY
    const diff = y - startY.current

    if (diff > 0) {
      e.preventDefault()
      const distance = Math.min(diff * 0.5, MAX_PULL)
      setPullDistance(distance)
      setPulling(true)
    }
  }, [refreshing])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return
    isPulling.current = false

    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true)
      setPullDistance(THRESHOLD)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        setPullDistance(0)
        setPulling(false)
      }
    } else {
      setPullDistance(0)
      setPulling(false)
    }
  }, [pullDistance, refreshing, onRefresh])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const progress = Math.min(pullDistance / THRESHOLD, 1)

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute left-0 right-0 top-0 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-200',
          (pulling || refreshing) ? 'opacity-100' : 'opacity-0'
        )}
        style={{ height: `${pullDistance}px` }}
      >
        <div className={cn(
          'flex items-center justify-center h-8 w-8 rounded-full bg-[var(--crm-bg-card)] border border-[var(--crm-border)] shadow-sm transition-transform',
          refreshing && 'animate-spin'
        )}
          style={{ transform: `rotate(${progress * 360}deg)` }}
        >
          <RefreshCw className="h-4 w-4 text-[var(--crm-text-muted)]" />
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{ transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined }}
      >
        {children}
      </div>
    </div>
  )
}
