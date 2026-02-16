"use client"

import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { StageConfig } from '@/lib/types/lead'
import { Inbox, Plus } from 'lucide-react'

interface KanbanColumnProps {
  stage: StageConfig
  leadCount: number
  isOver?: boolean
  onQuickAdd?: (stageId: string) => void
  children: React.ReactNode
}

export const KanbanColumn = memo(function KanbanColumn({ stage, leadCount, isOver: isOverProp, onQuickAdd, children }: KanbanColumnProps) {
  const { setNodeRef, isOver: isDropOver } = useDroppable({ id: stage.id })
  const isActive = isOverProp || isDropOver
  const isEmpty = leadCount === 0

  return (
    <div
      ref={setNodeRef}
      role="region"
      aria-label={`Columna ${stage.label} — ${leadCount} leads`}
      className={cn(
        'w-full h-full flex flex-col rounded-[var(--crm-radius-lg)] border bg-[var(--crm-bg-card)] overflow-hidden',
        'transition-all duration-[var(--crm-transition)]',
        isActive
          ? 'border-[var(--crm-primary)] ring-2 ring-[var(--crm-primary)]/10 bg-[var(--crm-bg-subtle)]'
          : 'border-[var(--crm-border)]'
      )}
    >
      {/* Color bar indicator (2-3px) */}
      <div className={cn('h-[3px] w-full shrink-0', stage.bar)} />

      {/* Sticky header */}
      <div className="sticky top-0 z-[1] border-b border-[var(--crm-border-light)] bg-[var(--crm-bg-card)] px-3 py-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-[13px] font-semibold text-[var(--crm-text)] truncate">
              {stage.label}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold crm-mono',
              stage.badge
            )}>
              {leadCount}
            </span>
            {onQuickAdd && (
              <button
                onClick={() => onQuickAdd(stage.id)}
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-[var(--crm-radius-sm)]',
                  'text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)]',
                  'transition-all duration-[var(--crm-transition-fast)] crm-focus-ring'
                )}
                aria-label={`Agregar lead a ${stage.label}`}
                title="Agregar lead"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content with independent scroll */}
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 group relative">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--crm-bg-subtle)] mb-3">
              <Inbox className="h-5 w-5 text-[var(--crm-text-muted)]" />
            </div>
            <p className="crm-subtitle">Sin leads</p>
            <p className="crm-meta mt-0.5">Arrastrá un lead aquí</p>
            {onQuickAdd && (
              <button
                onClick={() => onQuickAdd(stage.id)}
                className={cn(
                  'mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--crm-radius-md)]',
                  'text-[12px] font-medium text-[var(--crm-text-muted)]',
                  'border border-dashed border-[var(--crm-border)]',
                  'hover:border-[var(--crm-border-hover)] hover:text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)]',
                  'transition-all duration-[var(--crm-transition)] crm-focus-ring'
                )}
              >
                <Plus className="h-3 w-3" />
                Agregar
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 p-2">
            {children}
            {onQuickAdd && (
              <button
                onClick={() => onQuickAdd(stage.id)}
                className={cn(
                  'flex items-center justify-center gap-1.5 w-full py-2 rounded-[var(--crm-radius-md)]',
                  'text-[12px] font-medium text-[var(--crm-text-muted)]',
                  'border border-dashed border-transparent',
                  'hover:border-[var(--crm-border)] hover:text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)]',
                  'transition-all duration-[var(--crm-transition)] crm-focus-ring',
                  'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
                )}
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Drop indicator overlay */}
        {isActive && !isEmpty && (
          <div className="absolute inset-0 border-2 border-dashed border-[var(--crm-primary)]/30 bg-[var(--crm-primary)]/[0.02] pointer-events-none z-[2]" />
        )}
      </div>
    </div>
  )
})
