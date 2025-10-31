"use client"

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

const STAGES = [
  { id: 'todo', label: 'To Do' },
  { id: 'doing', label: 'Doing' },
  { id: 'done', label: 'Done' },
]

function Item({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="p-2 bg-blue-200 m-2 rounded">
      {children}
    </div>
  )
}

function Column({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  
  return (
    <div
      ref={setNodeRef}
      className={`p-4 border-2 ${isOver ? 'bg-green-100' : 'bg-gray-100'}`}
    >
      <h2>{STAGES.find(s => s.id === id)?.label}</h2>
      {children}
    </div>
  )
}

export default function TestKanban() {
  const [items, setItems] = useState({
    todo: ['item1', 'item2'],
    doing: ['item3'],
    done: ['item4'],
  })
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(useSensor(PointerSensor))
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    console.log('Drag end:', { active: active.id, over: over?.id })
    
    if (!over) return
    
    const itemId = active.id as string
    const newColumnId = over.id as string
    
    // Find current column
    let currentColumn = ''
    for (const [col, items] of Object.entries(items)) {
      if (items.includes(itemId)) {
        currentColumn = col
        break
      }
    }
    
    if (currentColumn && currentColumn !== newColumnId) {
      setItems(prev => {
        const newItems = { ...prev }
        newItems[currentColumn as keyof typeof newItems] = 
          newItems[currentColumn as keyof typeof newItems].filter((id: string) => id !== itemId)
        ;(newItems[newColumnId as keyof typeof newItems] as string[]).push(itemId)
        return newItems
      })
    }
    
    setActiveId(null)
  }
  
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4">
        {STAGES.map(stage => (
          <Column key={stage.id} id={stage.id}>
            {items[stage.id as keyof typeof items].map((item: string) => (
              <Item key={item} id={item}>{item}</Item>
            ))}
          </Column>
        ))}
      </div>
      
      <DragOverlay>
        {activeId ? <div className="p-2 bg-blue-200 m-2 rounded">{activeId}</div> : null}
      </DragOverlay>
    </DndContext>
  )
}

