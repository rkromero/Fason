"use client"

import { useState, useEffect, useMemo } from 'react'
import { Lead, LeadSource, MOCK_OWNERS } from '@/lib/types/lead'
import { KanbanBoard } from '@/components/kanban-board'
import { KanbanTopBar, KanbanFilters, DEFAULT_FILTERS } from '@/components/kanban-top-bar'
import { KpiCards } from '@/components/kpi-cards'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { NewLeadDialog } from '@/components/new-lead-dialog'
import { CRMSidebar } from '@/components/crm-sidebar'

// ─── Mock enrichment ────────────────────────────────────────────
// Llena los campos nuevos con datos mock cuando la API no los devuelve
const MOCK_SOURCES: LeadSource[] = ['web', 'referido', 'redes', 'llamada', 'email', 'otro']
const MOCK_PRIORITIES: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C']
const MOCK_TAGS_POOL = ['urgente', 'VIP', 'recontactar', 'interesado', 'precio', 'muestra']

function seedRandom(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

function enrichLead(lead: Lead): Lead {
  const seed = seedRandom(lead.id)
  return {
    ...lead,
    source: lead.source ?? MOCK_SOURCES[seed % MOCK_SOURCES.length],
    owner: lead.owner ?? MOCK_OWNERS[seed % MOCK_OWNERS.length],
    priority: lead.priority ?? MOCK_PRIORITIES[seed % MOCK_PRIORITIES.length],
    tags: lead.tags ?? [MOCK_TAGS_POOL[seed % MOCK_TAGS_POOL.length], MOCK_TAGS_POOL[(seed + 2) % MOCK_TAGS_POOL.length]],
    firstContactDate: lead.firstContactDate ?? (lead.lastContact || new Date(new Date(lead.createdAt).getTime() + (seed % 72) * 60 * 60 * 1000).toISOString()),
    nextTaskDate: lead.nextTaskDate ?? (seed % 3 === 0 ? undefined : new Date(Date.now() + ((seed % 14) - 3) * 24 * 60 * 60 * 1000).toISOString()),
    nextTaskDescription: lead.nextTaskDescription ?? (seed % 3 === 0 ? undefined : ['Llamar', 'Enviar propuesta', 'Reunión', 'Seguimiento email'][seed % 4]),
  }
}

// ─── Filter logic ───────────────────────────────────────────────
function applyFilters(leads: Lead[], filters: KanbanFilters): Lead[] {
  let result = leads

  // Search
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase()
    result = result.filter((l) =>
      l.nombre.toLowerCase().includes(q) ||
      l.empresa.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.telefono.toLowerCase().includes(q) ||
      (l.tags ?? []).some((t) => t.toLowerCase().includes(q))
    )
  }

  // Quick filters
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const qf of filters.quickFilters) {
    switch (qf) {
      case 'hoy':
        result = result.filter((l) => {
          const d = new Date(l.createdAt)
          d.setHours(0, 0, 0, 0)
          return d.getTime() === today.getTime()
        })
        break
      case 'vencidos':
        result = result.filter((l) => l.nextTaskDate && new Date(l.nextTaskDate) < new Date())
        break
      case 'sin-tarea':
        result = result.filter((l) => !l.nextTaskDate)
        break
      case 'alta-prioridad':
        result = result.filter((l) => l.priority === 'A')
        break
    }
  }

  // Dropdown filters
  if (filters.source !== 'all') {
    result = result.filter((l) => l.source === filters.source)
  }
  if (filters.producto !== 'all') {
    result = result.filter((l) => l.producto === filters.producto)
  }
  if (filters.owner !== 'all') {
    result = result.filter((l) => l.owner === filters.owner)
  }

  // Sort
  result = [...result].sort((a, b) => {
    switch (filters.sortOrder) {
      case 'ultima-actividad':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'proxima-tarea': {
        const aDate = a.nextTaskDate ? new Date(a.nextTaskDate).getTime() : Infinity
        const bDate = b.nextTaskDate ? new Date(b.nextTaskDate).getTime() : Infinity
        return aDate - bDate
      }
      case 'mayor-monto': {
        const parseAmount = (s?: string) => {
          if (!s) return 0
          return Number(s.replace(/[^0-9.]/g, '')) || 0
        }
        return parseAmount(b.inversionEstimada) - parseAmount(a.inversionEstimada)
      }
      default:
        return 0
    }
  })

  return result
}

function countActiveFilters(filters: KanbanFilters): number {
  let count = 0
  if (filters.search) count++
  count += filters.quickFilters.length
  if (filters.source !== 'all') count++
  if (filters.producto !== 'all') count++
  if (filters.owner !== 'all') count++
  return count
}

// ─── Page ───────────────────────────────────────────────────────
export default function CRMPage() {
  const router = useRouter()
  const [rawLeads, setRawLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false)
  const [filters, setFilters] = useState<KanbanFilters>(DEFAULT_FILTERS)

  // Enrich leads con mock data
  const leads = useMemo(() => rawLeads.map(enrichLead), [rawLeads])

  // Filtered leads
  const filteredLeads = useMemo(() => applyFilters(leads, filters), [leads, filters])

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      if (response.ok) {
        const data = await response.json()
        setRawLeads(data.leads)
      } else {
        toast.error('Error al cargar los leads')
      }
    } catch (error) {
      console.error('Error al obtener leads:', error)
      toast.error('Error al cargar los leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const data = await response.json()
        setRawLeads((prevLeads) =>
          prevLeads.map((lead) => (lead.id === leadId ? data.lead : lead))
        )
        toast.success('Lead actualizado correctamente')
      } else {
        toast.error('Error al actualizar el lead')
      }
    } catch (error) {
      console.error('Error al actualizar lead:', error)
      toast.error('Error al actualizar el lead')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Solo visible en desktop */}
      <CRMSidebar />

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <div className="bg-white sticky top-0 z-10 shadow-md border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium text-gray-900 truncate">
                  LEADS
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredLeads.length === leads.length
                    ? `${leads.length} leads en total`
                    : `${filteredLeads.length} de ${leads.length} leads`}
                </p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => setIsNewLeadDialogOpen(true)}
                  size="default"
                  className="w-full sm:w-auto shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-md px-4 py-2 font-medium"
                >
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Nuevo Lead</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
                <Button
                  onClick={fetchLeads}
                  variant="outline"
                  size="default"
                  className="w-full sm:w-auto shrink-0 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md px-4 py-2 font-medium"
                >
                  <RefreshCw className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <KpiCards leads={leads} />
          </div>
        </div>

        {/* Kanban area */}
        <div className="w-full px-4 sm:px-6 py-4 sm:py-6">
          {/* Top Bar: búsqueda + filtros */}
          <KanbanTopBar
            filters={filters}
            onFiltersChange={setFilters}
            activeFilterCount={activeFilterCount}
          />

          {/* Tablero Kanban */}
          <KanbanBoard leads={filteredLeads} onUpdateLead={handleUpdateLead} />
        </div>

        {/* Dialog para nuevo lead */}
        <NewLeadDialog
          open={isNewLeadDialogOpen}
          onOpenChange={setIsNewLeadDialogOpen}
          onLeadCreated={fetchLeads}
        />
      </div>
    </div>
  )
}
