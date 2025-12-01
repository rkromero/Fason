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

  // Mapear colores Material Design
  const getMaterialColor = (stageId: string) => {
    const colorMap: Record<string, string> = {
      'entrante': 'bg-blue-50 border-blue-200 text-blue-900',
      'primer-llamado': 'bg-amber-50 border-amber-200 text-amber-900',
      'seguimiento': 'bg-orange-50 border-orange-200 text-orange-900',
      'negociacion': 'bg-purple-50 border-purple-200 text-purple-900',
      'ganado': 'bg-green-50 border-green-200 text-green-900',
      'perdido': 'bg-red-50 border-red-200 text-red-900',
    }
    return colorMap[stageId] || 'bg-gray-50 border-gray-200 text-gray-900'
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-full h-full flex flex-col rounded-lg border transition-all duration-200 bg-white shadow-sm',
        getMaterialColor(stage.id),
        isOver && 'shadow-lg ring-2 ring-blue-400 ring-opacity-50'
      )}
    >
      <div className="border-b bg-white/50 backdrop-blur-sm p-3 md:p-4 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-sm md:text-base text-gray-900 truncate">{stage.label}</h3>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-gray-700 text-xs font-semibold shrink-0">
            {leadCount}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 bg-transparent">
        <div className="flex flex-col gap-3 p-3">{children}</div>
      </div>
    </div>
  )
}

