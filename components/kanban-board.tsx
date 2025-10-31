"use client"

import { useState } from 'react'
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

interface KanbanBoardProps {
  leads: Lead[]
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void
}

export function KanbanBoard({ leads, onUpdateLead }: KanbanBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((lead) => lead.stage === stage.id)
          return (
            <SortableContext
              key={stage.id}
              items={stageLeads.map((lead) => lead.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn stage={stage} leadCount={stageLeads.length}>
                {stageLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </KanbanColumn>
            </SortableContext>
          )
        })}
      </div>

      <DragOverlay>
        {activeLead && <LeadCard lead={activeLead} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}

