"use client"

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { StageConfig } from '@/lib/types/lead'
import { Inbox } from 'lucide-react'

interface KanbanColumnProps {
  stage: StageConfig
  leadCount: number
  children: React.ReactNode
}

export function KanbanColumn({ stage, leadCount, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  })

  const isEmpty = leadCount === 0

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-full h-full flex flex-col rounded-lg border border-gray-200/80 bg-white transition-all duration-150',
        isOver && 'border-gray-400 ring-1 ring-gray-400/20 bg-gray-50/50'
      )}
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-[1] border-b border-gray-100 bg-white px-3 py-2.5 shrink-0 rounded-t-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn('crm-dot', stage.dot)} />
            <h3 className="text-[13px] font-semibold text-gray-900 truncate">
              {stage.label}
            </h3>
          </div>
          <span className={cn(
            'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
            stage.badge
          )}>
            {leadCount}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 mb-3">
              <Inbox className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-[13px] text-gray-400 font-medium">Sin leads</p>
            <p className="text-[11px] text-gray-300 mt-0.5">Arrastrá un lead aquí</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 p-2">{children}</div>
        )}
      </div>
    </div>
  )
}
