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
        'min-w-[300px] rounded-lg border-2 transition-colors',
        stage.color,
        isOver && 'ring-2 ring-offset-2'
      )}
    >
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{stage.label}</h3>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-current/20 text-sm font-medium">
            {leadCount}
          </span>
        </div>
      </div>
      <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
        <div className="flex flex-col gap-3 p-3">{children}</div>
      </div>
    </div>
  )
}

