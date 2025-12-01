"use client"

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  stage: {
    id: string
    label: string
    color: string
  }
  leadCount: number
  children: React.ReactNode
}

export function KanbanColumn({ stage, leadCount, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-full h-full flex flex-col rounded-lg border-2 transition-colors',
        stage.color,
        isOver && 'ring-2 ring-offset-2'
      )}
    >
      <div className="border-b p-2 md:p-2.5 lg:p-3 shrink-0">
        <div className="flex items-center justify-between gap-1.5 md:gap-2">
          <h3 className="font-semibold text-xs md:text-sm lg:text-base truncate">{stage.label}</h3>
          <span className="flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-current/20 text-xs font-medium shrink-0">
            {leadCount}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
        <div className="flex flex-col gap-2 p-1.5 md:p-2">{children}</div>
      </div>
    </div>
  )
}

