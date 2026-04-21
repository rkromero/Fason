"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Lead, LeadStage, STAGES } from '@/lib/types/lead'
import { KanbanColumn } from './kanban-column'
import { LeadCard } from './lead-card'
import { MobileLeadCard } from './mobile-lead-card'
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
  const swipeRef = useRef({ startX: 0, startY: 0, swiping: false })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    const lead = leads.find((l) => l.id === event.active.id)
    setActiveLead(lead || null)
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(10)
    }
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
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(5)
    }
    const leadId = active.id as string
    const newStage = over.id as LeadStage
    const isValidStage = STAGES.some((stage) => stage.id === newStage)
    if (!isValidStage) return
    onUpdateLead(leadId, { stage: newStage })
  }

  const goToStage = useCallback((index: number) => {
    setCurrentStageIndex(Math.max(0, Math.min(STAGES.length - 1, index)))
  }, [])

  // Swipe between columns - only horizontal, let vertical scroll through
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onTouchStart = (e: TouchEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('button') || t.closest('a') || t.closest('[role="button"]')) return
      swipeRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        swiping: false,
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      const s = swipeRef.current
      if (!s.startX) return
      const dx = e.touches[0].clientX - s.startX
      const dy = e.touches[0].clientY - s.startY
      // Only hijack if clearly horizontal (2:1 ratio) and moved enough
      if (!s.swiping && Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) * 2) {
        s.swiping = true
      }
      if (s.swiping) {
        e.preventDefault()
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      const s = swipeRef.current
      if (!s.swiping) {
        swipeRef.current = { startX: 0, startY: 0, swiping: false }
        return
      }
      const dx = e.changedTouches[0].clientX - s.startX
      if (Math.abs(dx) > 50) {
        if (dx < 0) goToStage(currentStageIndex + 1)
        else goToStage(currentStageIndex - 1)
      }
      swipeRef.current = { startX: 0, startY: 0, swiping: false }
    }

    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
    }
  }, [currentStageIndex, goToStage])

  // Pre-compute leads grouped by stage (avoids .filter() per column per render)
  const leadsByStage = useMemo(() => {
    const map: Record<string, Lead[]> = {}
    for (const s of STAGES) map[s.id] = []
    for (const l of leads) {
      if (map[l.stage]) map[l.stage].push(l)
    }
    return map
  }, [leads])

  const currentStage = STAGES[currentStageIndex]
  const currentLeads = leadsByStage[currentStage.id] || []

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="relative flex-1" role="region" aria-label="Tablero Kanban">
        {/* ─── Mobile: Stage tabs (scrollable pills) ──── */}
        <div className="md:hidden mb-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide -mx-1 px-1" role="tablist" aria-label="Etapas del pipeline">
            {STAGES.map((stage, index) => {
              const count = (leadsByStage[stage.id] || []).length
              const isActive = currentStageIndex === index
              return (
                <button
                  key={stage.id}
                  onClick={() => goToStage(index)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-medium whitespace-nowrap',
                    'transition-all duration-200 min-h-[36px]',
                    isActive
                      ? 'bg-[var(--crm-text)] text-white shadow-sm'
                      : 'bg-[var(--crm-bg-card)] text-[var(--crm-text-secondary)] border border-[var(--crm-border)] active:bg-[var(--crm-bg-hover)]'
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full shrink-0', isActive ? 'bg-white/60' : stage.dot)} />
                  {stage.label}
                  {count > 0 && (
                    <span className={cn(
                      'flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold crm-mono',
                      isActive ? 'bg-white/20 text-white' : 'bg-[var(--crm-bg-subtle)] text-[var(--crm-text-muted)]'
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── Mobile: Column content (swipeable) ───── */}
        <div ref={containerRef} className="md:hidden overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentStageIndex * 100}%)` }}
          >
            {STAGES.map((stage) => {
              const stageLeads = leadsByStage[stage.id] || []
              return (
                <div key={stage.id} className="w-full shrink-0">
                  {isLoading ? (
                    <div className="space-y-3 p-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-[var(--crm-radius-md)] border border-[var(--crm-border-light)] bg-[var(--crm-bg-card)] p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-[var(--crm-border)]" />
                            <div className="h-3 w-3/4 bg-[var(--crm-border-light)] rounded" />
                          </div>
                          <div className="h-2.5 w-1/2 bg-[var(--crm-border-light)] rounded ml-4" />
                        </div>
                      ))}
                    </div>
                  ) : stageLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-10 w-10 rounded-full bg-[var(--crm-bg-subtle)] flex items-center justify-center mb-2">
                        <span className="text-[var(--crm-text-muted)] text-lg">0</span>
                      </div>
                      <p className="text-[13px] text-[var(--crm-text-muted)]">Sin leads en {stage.label}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 pb-4">
                      {stageLeads.map((lead) => (
                        <MobileLeadCard
                          key={lead.id}
                          lead={lead}
                          onUpdateLead={onUpdateLead}
                          onDeleteLead={onDeleteLead}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── Desktop: grid columns (fit to screen) ────── */}
        <div className="hidden md:block pb-2">
          <div
            className="grid grid-cols-6 gap-3"
            style={{ height: 'calc(100vh - 260px)' }}
          >
            {STAGES.map((stage) => {
              const stageLeads = leadsByStage[stage.id] || []
              return (
                <div key={stage.id} className="h-full min-w-0">
                  <KanbanColumn
                    stage={stage}
                    leadCount={stageLeads.length}
                    isOver={overColumnId === stage.id}
                    onQuickAdd={onQuickAdd}
                    isLoading={isLoading}
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

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        {activeLead && <LeadCard lead={activeLead} isDragging density={density} />}
      </DragOverlay>
    </DndContext>
  )
}
