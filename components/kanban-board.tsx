"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Lead, LeadStage, STAGES } from '@/lib/types/lead'
import { KanbanColumn } from './kanban-column'
import { LeadCard } from './lead-card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DensityMode } from '@/lib/types/lead'

interface KanbanBoardProps {
  leads: Lead[]
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void
  onDeleteLead: (leadId: string) => void
  onQuickAdd?: (stageId: string) => void
  density?: DensityMode
  isLoading?: boolean
}

export function KanbanBoard({ leads, onUpdateLead, onDeleteLead, onQuickAdd, density = 'comfortable', isLoading }: KanbanBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchEndY = useRef<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const lead = leads.find((l) => l.id === event.active.id)
    setActiveLead(lead || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (over) {
      const isStage = STAGES.some((s) => s.id === over.id)
      setOverColumnId(isStage ? (over.id as string) : null)
    } else {
      setOverColumnId(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveLead(null)
    setOverColumnId(null)
    if (!over) return
    const leadId = active.id as string
    const newStage = over.id as LeadStage
    const isValidStage = STAGES.some((stage) => stage.id === newStage)
    if (!isValidStage) return
    onUpdateLead(leadId, { stage: newStage })
  }

  const goToNextStage = useCallback(() => {
    setCurrentStageIndex((prev) => (prev + 1) % STAGES.length)
  }, [])

  const goToPreviousStage = useCallback(() => {
    setCurrentStageIndex((prev) => (prev - 1 + STAGES.length) % STAGES.length)
  }, [])

  const goToStage = (index: number) => setCurrentStageIndex(index)

  // Swipe gestures
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let isHorizontalSwipe = false

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-sortable-id]') || target.closest('button') || target.closest('a')) return
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      isHorizontalSwipe = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return
      touchEndX.current = e.touches[0].clientX
      touchEndY.current = e.touches[0].clientY
      const deltaX = Math.abs(touchEndX.current - touchStartX.current)
      const deltaY = Math.abs((touchEndY.current || 0) - touchStartY.current)
      if (deltaX > deltaY && deltaX > 5) {
        isHorizontalSwipe = true
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      } else if (deltaY > deltaX && deltaY > 5) {
        isHorizontalSwipe = false
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartX.current || !touchEndX.current) {
        touchStartX.current = null; touchEndX.current = null
        touchStartY.current = null; touchEndY.current = null
        isHorizontalSwipe = false
        return
      }
      const distance = touchStartX.current - touchEndX.current
      const verticalDistance = touchStartY.current && touchEndY.current ? Math.abs(touchEndY.current - touchStartY.current) : 0
      if (isHorizontalSwipe && Math.abs(distance) > 30 && Math.abs(distance) > verticalDistance) {
        e.preventDefault()
        e.stopPropagation()
        if (distance > 0) goToNextStage()
        else goToPreviousStage()
      }
      touchStartX.current = null; touchEndX.current = null
      touchStartY.current = null; touchEndY.current = null
      isHorizontalSwipe = false
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: false, capture: true })

    const preventBodyScroll = (e: TouchEvent) => { if (isHorizontalSwipe) e.preventDefault() }
    document.body.addEventListener('touchmove', preventBodyScroll, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      document.body.removeEventListener('touchmove', preventBodyScroll)
    }
  }, [goToNextStage, goToPreviousStage])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="relative flex-1">
        {/* ─── Mobile navigation ─────────────────────────── */}
        <div className="md:hidden mb-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {STAGES.map((stage, index) => {
              const count = leads.filter((l) => l.stage === stage.id).length
              const isActive = currentStageIndex === index
              return (
                <button
                  key={stage.id}
                  onClick={() => goToStage(index)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--crm-radius-md)] text-[12px] font-medium whitespace-nowrap border crm-focus-ring',
                    'transition-all duration-[var(--crm-transition)]',
                    isActive
                      ? 'bg-[var(--crm-primary)] text-white border-[var(--crm-primary)] shadow-sm'
                      : 'bg-[var(--crm-bg-card)] text-[var(--crm-text-secondary)] border-[var(--crm-border)] hover:bg-[var(--crm-bg-hover)]'
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', isActive ? 'bg-white' : stage.dot)} />
                  {stage.label}
                  <span className={cn('text-[10px] font-bold crm-mono ml-0.5', isActive ? 'text-white/60' : 'text-[var(--crm-text-muted)]')}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-center gap-3 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousStage}
              className="h-7 w-7 p-0 rounded-[var(--crm-radius-md)] text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {STAGES.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-1 rounded-full transition-all duration-200',
                    currentStageIndex === index ? 'w-4 bg-[var(--crm-primary)]' : 'w-1 bg-[var(--crm-border)]'
                  )}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextStage}
              className="h-7 w-7 p-0 rounded-[var(--crm-radius-md)] text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ─── Columns container ─────────────────────────── */}
        <div ref={containerRef} className="relative flex-1">
          {/* Mobile: one column at a time */}
          <div className="md:hidden overflow-hidden" style={{ touchAction: 'none' }}>
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentStageIndex * 100}%)` }}
            >
              {STAGES.map((stage) => {
                const stageLeads = leads.filter((lead) => lead.stage === stage.id)
                return (
                  <div key={stage.id} className="w-full shrink-0 px-1">
                    <KanbanColumn
                      stage={stage}
                      leadCount={stageLeads.length}
                      isOver={overColumnId === stage.id}
                      onQuickAdd={onQuickAdd}
                    >
                      <SortableContext items={stageLeads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                        {stageLeads.map((lead) => (
                          <LeadCard key={lead.id} lead={lead} onUpdateLead={onUpdateLead} onDeleteLead={onDeleteLead} density={density} />
                        ))}
                      </SortableContext>
                    </KanbanColumn>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Desktop: horizontal scroll with fixed-width columns */}
          <div className="hidden md:block overflow-x-auto scrollbar-hide pb-2">
            <div
              className="flex gap-3"
              style={{ height: 'calc(100vh - 260px)', minWidth: 'max-content' }}
            >
              {STAGES.map((stage) => {
                const stageLeads = leads.filter((lead) => lead.stage === stage.id)
                return (
                  <div key={stage.id} style={{ width: 'var(--crm-col-width)', minWidth: 'var(--crm-col-width)' }} className="shrink-0 h-full">
                    <KanbanColumn
                      stage={stage}
                      leadCount={stageLeads.length}
                      isOver={overColumnId === stage.id}
                      onQuickAdd={onQuickAdd}
                    >
                      <SortableContext items={stageLeads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                        {stageLeads.map((lead) => (
                          <LeadCard key={lead.id} lead={lead} onUpdateLead={onUpdateLead} onDeleteLead={onDeleteLead} density={density} />
                        ))}
                      </SortableContext>
                    </KanbanColumn>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        {activeLead && <LeadCard lead={activeLead} isDragging density={density} />}
      </DragOverlay>
    </DndContext>
  )
}
