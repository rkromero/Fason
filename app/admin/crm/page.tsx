"use client"

import { useState, useEffect, useMemo } from 'react'
import { Lead, LeadSource, MOCK_OWNERS } from '@/lib/types/lead'
import { KanbanBoard } from '@/components/kanban-board'
import { KanbanTopBar, KanbanFilters, DEFAULT_FILTERS } from '@/components/kanban-top-bar'
import { KpiCards } from '@/components/kpi-cards'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { NewLeadDialog } from '@/components/new-lead-dialog'
import { CRMSidebar } from '@/components/crm-sidebar'

// ─── Mock enrichment ────────────────────────────────────────────
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const qf of filters.quickFilters) {
    switch (qf) {
      case 'hoy':
        result = result.filter((l) => { const d = new Date(l.createdAt); d.setHours(0, 0, 0, 0); return d.getTime() === today.getTime() })
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

  if (filters.source !== 'all') result = result.filter((l) => l.source === filters.source)
  if (filters.producto !== 'all') result = result.filter((l) => l.producto === filters.producto)
  if (filters.owner !== 'all') result = result.filter((l) => l.owner === filters.owner)

  result = [...result].sort((a, b) => {
    switch (filters.sortOrder) {
      case 'ultima-actividad':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'proxima-tarea': {
        const aD = a.nextTaskDate ? new Date(a.nextTaskDate).getTime() : Infinity
        const bD = b.nextTaskDate ? new Date(b.nextTaskDate).getTime() : Infinity
        return aD - bD
      }
      case 'mayor-monto': {
        const parse = (s?: string) => s ? Number(s.replace(/[^0-9.]/g, '')) || 0 : 0
        return parse(b.inversionEstimada) - parse(a.inversionEstimada)
      }
      default: return 0
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
  const [rawLeads, setRawLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false)
  const [filters, setFilters] = useState<KanbanFilters>(DEFAULT_FILTERS)

  const leads = useMemo(() => rawLeads.map(enrichLead), [rawLeads])
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

  useEffect(() => { fetchLeads() }, [])

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (response.ok) {
        const data = await response.json()
        setRawLeads((prev) => prev.map((lead) => (lead.id === leadId ? data.lead : lead)))
        toast.success('Lead actualizado')
      } else {
        toast.error('Error al actualizar el lead')
      }
    } catch (error) {
      console.error('Error al actualizar lead:', error)
      toast.error('Error al actualizar el lead')
    }
  }

  // ─── Loading state ────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen crm-surface">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500 font-medium">Cargando leads…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen crm-surface flex">
      <CRMSidebar />

      <div className="flex-1 md:ml-64">
        {/* ─── Sticky header ───────────────────────────── */}
        <div className="crm-header sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            {/* Row 1: Title + Actions */}
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">
                  Leads
                </h1>
                <p className="text-[12px] text-gray-500 mt-0.5 tabular-nums">
                  {filteredLeads.length === leads.length
                    ? `${leads.length} leads`
                    : `${filteredLeads.length} de ${leads.length} leads`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={fetchLeads}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  title="Actualizar"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  onClick={() => setIsNewLeadDialogOpen(true)}
                  size="sm"
                  className="crm-btn-primary gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Nuevo Lead</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              </div>
            </div>

            {/* Row 2: KPI cards */}
            <KpiCards leads={leads} />
          </div>
        </div>

        {/* ─── Kanban area ─────────────────────────────── */}
        <div className="px-4 sm:px-6 py-4">
          <KanbanTopBar
            filters={filters}
            onFiltersChange={setFilters}
            activeFilterCount={activeFilterCount}
          />
          <KanbanBoard leads={filteredLeads} onUpdateLead={handleUpdateLead} />
        </div>

        <NewLeadDialog
          open={isNewLeadDialogOpen}
          onOpenChange={setIsNewLeadDialogOpen}
          onLeadCreated={fetchLeads}
        />
      </div>
    </div>
  )
}
