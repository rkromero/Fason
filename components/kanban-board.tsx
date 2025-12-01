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

    let isHorizontalSwipe = false

    const handleTouchStart = (e: TouchEvent) => {
      // Solo capturar si no es una tarjeta, botón o enlace
      const target = e.target as HTMLElement
      if (target.closest('[data-sortable-id]') || target.closest('button') || target.closest('a')) {
        return
      }
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      isHorizontalSwipe = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return
      
      touchEndX.current = e.touches[0].clientX
      touchEndY.current = e.touches[0].clientY

      // Calcular la distancia horizontal y vertical
      const deltaX = Math.abs(touchEndX.current - touchStartX.current)
      const deltaY = Math.abs((touchEndY.current || 0) - touchStartY.current)

      // Si el movimiento es principalmente horizontal, prevenir el scroll de la página
      if (deltaX > deltaY && deltaX > 5) {
        isHorizontalSwipe = true
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      } else if (deltaY > deltaX && deltaY > 5) {
        // Si es principalmente vertical, permitir scroll
        isHorizontalSwipe = false
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartX.current || !touchEndX.current) {
        touchStartX.current = null
        touchEndX.current = null
        touchStartY.current = null
        touchEndY.current = null
        isHorizontalSwipe = false
        return
      }

      const distance = touchStartX.current - touchEndX.current
      const verticalDistance = touchStartY.current && touchEndY.current 
        ? Math.abs(touchEndY.current - touchStartY.current) 
        : 0
      const minSwipeDistance = 30

      // Solo procesar swipe si es principalmente horizontal
      if (isHorizontalSwipe && Math.abs(distance) > minSwipeDistance && Math.abs(distance) > verticalDistance) {
        e.preventDefault()
        e.stopPropagation()
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
      isHorizontalSwipe = false
    }

    // Agregar event listeners con passive: false para poder hacer preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: false, capture: true })

    // También prevenir scroll en el body cuando hay un swipe horizontal activo
    const preventBodyScroll = (e: TouchEvent) => {
      if (isHorizontalSwipe) {
        e.preventDefault()
      }
    }

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
      onDragEnd={handleDragEnd}
    >
      <div className="relative">
        {/* Navegación mobile - Botones y indicadores mejorados */}
        <div className="md:hidden mb-4">
          {/* Indicadores de columnas - Diseño tipo tabs mejorado */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 px-1 scrollbar-hide">
            {STAGES.map((stage, index) => {
              const stageLeads = leads.filter((lead) => lead.stage === stage.id)
              const isActive = currentStageIndex === index
              return (
                <button
                  key={stage.id}
                  onClick={() => goToStage(index)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-200 min-w-[90px] relative',
                    'border-2 shadow-sm',
                    isActive
                      ? 'bg-white border-blue-500 text-blue-700 shadow-md scale-105'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 active:scale-95'
                  )}
                >
                  {/* Indicador activo */}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-b-full" />
                  )}
                  <span className={cn(
                    'text-xs font-semibold truncate w-full text-center leading-tight',
                    isActive ? 'text-blue-700' : 'text-gray-600'
                  )}>
                    {stage.label}
                  </span>
                  <span className={cn(
                    'text-sm font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center',
                    isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-200 text-gray-700'
                  )}>
                    {stageLeads.length}
                  </span>
                </button>
              )
            })}
          </div>
          
          {/* Botones de navegación mejorados */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousStage}
              className="h-9 px-4 rounded-lg border-gray-300 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md transition-all"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Anterior</span>
            </Button>
            
            <div className="flex items-center gap-1.5">
              {STAGES.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-200',
                    currentStageIndex === index
                      ? 'w-6 bg-blue-500'
                      : 'w-1.5 bg-gray-300'
                  )}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextStage}
              className="h-9 px-4 rounded-lg border-gray-300 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md transition-all"
            >
              <span className="text-sm font-medium">Siguiente</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Contenedor de columnas */}
        <div
          ref={containerRef}
          className="relative"
        >
          {/* Vista mobile: una columna a la vez */}
          <div className="md:hidden overflow-hidden" style={{ touchAction: 'none' }}>
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

