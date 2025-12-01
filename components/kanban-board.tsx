"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
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

interface KanbanBoardProps {
  leads: Lead[]
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void
}

export function KanbanBoard({ leads, onUpdateLead }: KanbanBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchEndY = useRef<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Distancia mínima para activar drag (muy sensible)
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const lead = leads.find((l) => l.id === active.id)
    setActiveLead(lead || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveLead(null)

    if (!over) {
      console.log('No over target in handleDragEnd')
      return
    }

    const leadId = active.id as string
    const newStage = over.id as LeadStage

    console.log('Dropping lead:', leadId, 'to stage:', newStage)

    // Verificar que el stage sea válido
    const isValidStage = STAGES.some((stage) => stage.id === newStage)
    if (!isValidStage) {
      console.log('Invalid stage:', newStage)
      return
    }

    onUpdateLead(leadId, { stage: newStage })
  }

  // Navegación entre columnas
  const goToNextStage = useCallback(() => {
    setCurrentStageIndex((prev) => (prev + 1) % STAGES.length)
  }, [])

  const goToPreviousStage = useCallback(() => {
    setCurrentStageIndex((prev) => (prev - 1 + STAGES.length) % STAGES.length)
  }, [])

  const goToStage = (index: number) => {
    setCurrentStageIndex(index)
  }

  // Manejo de swipe gestures usando event listeners nativos (para poder usar passive: false)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      // Solo capturar si no es una tarjeta, botón o enlace
      const target = e.target as HTMLElement
      if (target.closest('[data-sortable-id]') || target.closest('button') || target.closest('a')) {
        return
      }
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return
      
      touchEndX.current = e.touches[0].clientX
      touchEndY.current = e.touches[0].clientY

      // Calcular la distancia horizontal y vertical
      const deltaX = Math.abs(touchEndX.current - touchStartX.current)
      const deltaY = Math.abs((touchEndY.current || 0) - touchStartY.current)

      // Si el movimiento es principalmente horizontal, prevenir el scroll de la página
      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const handleTouchEnd = () => {
      if (!touchStartX.current || !touchEndX.current) {
        touchStartX.current = null
        touchEndX.current = null
        touchStartY.current = null
        touchEndY.current = null
        return
      }

      const distance = touchStartX.current - touchEndX.current
      const verticalDistance = touchStartY.current && touchEndY.current 
        ? Math.abs(touchEndY.current - touchStartY.current) 
        : 0
      const minSwipeDistance = 50

      // Solo procesar swipe si es principalmente horizontal
      if (Math.abs(distance) > minSwipeDistance && Math.abs(distance) > verticalDistance) {
        if (distance > 0) {
          // Swipe izquierda - siguiente columna
          goToNextStage()
        } else {
          // Swipe derecha - columna anterior
          goToPreviousStage()
        }
      }

      touchStartX.current = null
      touchEndX.current = null
      touchStartY.current = null
      touchEndY.current = null
    }

    // Agregar event listeners con passive: false para poder hacer preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [goToNextStage, goToPreviousStage])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="relative">
        {/* Navegación mobile - Botones y indicadores */}
        <div className="md:hidden mb-4 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousStage}
            className="h-10 w-10 shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Indicadores de columnas */}
          <div className="flex-1 flex items-center justify-center gap-2 overflow-x-auto px-4">
            {STAGES.map((stage, index) => {
              const stageLeads = leads.filter((lead) => lead.stage === stage.id)
              return (
                <button
                  key={stage.id}
                  onClick={() => goToStage(index)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[80px]',
                    currentStageIndex === index
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <span className="text-xs font-medium truncate w-full text-center">
                    {stage.label}
                  </span>
                  <span className="text-xs font-bold">{stageLeads.length}</span>
                </button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextStage}
            className="h-10 w-10 shrink-0"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Contenedor de columnas */}
        <div
          ref={containerRef}
          className="relative"
          style={{ touchAction: 'pan-y pinch-zoom' }}
        >
          {/* Vista mobile: una columna a la vez */}
          <div className="md:hidden overflow-hidden" style={{ touchAction: 'pan-x' }}>
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentStageIndex * 100}%)`,
              }}
            >
              {STAGES.map((stage) => {
                const stageLeads = leads.filter((lead) => lead.stage === stage.id)
                return (
                  <div key={stage.id} className="w-full shrink-0 px-2">
                    <KanbanColumn
                      stage={stage}
                      leadCount={stageLeads.length}
                    >
                      <SortableContext
                        items={stageLeads.map((lead) => lead.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {stageLeads.map((lead) => (
                          <LeadCard key={lead.id} lead={lead} onUpdateLead={onUpdateLead} />
                        ))}
                      </SortableContext>
                    </KanbanColumn>
                  </div>
                )
              })}
            </div>
          </div>

                {/* Vista desktop: todas las columnas visibles sin scroll */}
                <div className="hidden md:grid md:grid-cols-6 gap-4 h-[calc(100vh-280px)]">
            {STAGES.map((stage) => {
              const stageLeads = leads.filter((lead) => lead.stage === stage.id)
              return (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  leadCount={stageLeads.length}
                >
                  <SortableContext
                    items={stageLeads.map((lead) => lead.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {stageLeads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} onUpdateLead={onUpdateLead} />
                    ))}
                  </SortableContext>
                </KanbanColumn>
              )
            })}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeLead && <LeadCard lead={activeLead} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}

