"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Lead } from '@/lib/types/lead'
import { User } from '@/lib/types/user'
import { KanbanBoard } from '@/components/kanban-board'
import { LeadsListView } from '@/components/leads-list-view'
import { KanbanTopBar, KanbanFilters, DEFAULT_FILTERS } from '@/components/kanban-top-bar'
import { KpiCards, KpiCardsSkeleton } from '@/components/kpi-cards'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus, AlertTriangle, Inbox, LayoutGrid, List } from 'lucide-react'
import { toast } from 'sonner'
import { NewLeadDialog } from '@/components/new-lead-dialog'
import { CRMSidebar } from '@/components/crm-sidebar'
import { cn } from '@/lib/utils'

// ─── Lead enrichment (derive computed fields only) ──────────────
function enrichLead(lead: Lead): Lead {
  const tasks = lead.tasks || []
  const nextPending = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

  return {
    ...lead,
    nextTaskDate: lead.nextTaskDate ?? nextPending?.dueDate,
    nextTaskDescription: lead.nextTaskDescription ?? nextPending?.description,
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
  if (filters.owner !== 'all') result = result.filter((l) => l.ownerId === filters.owner)

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
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false)
  const [filters, setFilters] = useState<KanbanFilters>(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')

  const leads = useMemo(() => rawLeads.map(enrichLead), [rawLeads])
  const filteredLeads = useMemo(() => applyFilters(leads, filters), [leads, filters])
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters])
  const hasActiveFilters = activeFilterCount > 0

  const fetchLeads = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const [leadsRes, usersRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/users'),
      ])
      if (leadsRes.ok) {
        const data = await leadsRes.json()
        setRawLeads(data.leads)
      } else {
        setError('No se pudieron cargar los leads. Intentá de nuevo.')
        toast.error('Error al cargar los leads')
      }
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers((data.users || []).filter((u: User) => u.activo))
      }
    } catch (err) {
      console.error('Error al obtener leads:', err)
      setError('Error de conexión. Verificá tu internet e intentá de nuevo.')
      toast.error('Error al cargar los leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

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
    } catch (err) {
      console.error('Error al actualizar lead:', err)
      toast.error('Error al actualizar el lead')
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' })
      if (response.ok) {
        setRawLeads((prev) => prev.filter((lead) => lead.id !== leadId))
        toast.success('Lead eliminado')
      } else {
        toast.error('Error al eliminar el lead')
      }
    } catch (err) {
      console.error('Error al eliminar lead:', err)
      toast.error('Error al eliminar el lead')
    }
  }

  const handleQuickAdd = (stageId: string) => {
    setIsNewLeadDialogOpen(true)
  }

  return (
    <div className="min-h-screen crm-surface flex">
      <CRMSidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* ─── Sticky header ───────────────────────────── */}
        <div className="crm-header sticky top-0 z-10 shrink-0">
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            {/* Row 1: Title + Actions */}
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="min-w-0">
                <h1 className="crm-title">Leads</h1>
                <p className="crm-meta crm-mono mt-0.5">
                  {loading ? (
                    <span className="crm-skeleton inline-block w-16 h-3" />
                  ) : filteredLeads.length === leads.length ? (
                    `${leads.length} leads`
                  ) : (
                    <>Mostrando {filteredLeads.length} de {leads.length} leads</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {/* View mode toggle */}
                <div className="hidden sm:flex items-center rounded-[var(--crm-radius-md)] border border-[var(--crm-border)] overflow-hidden">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={cn(
                      'flex items-center justify-center h-8 w-8 transition-colors',
                      viewMode === 'kanban'
                        ? 'bg-[var(--crm-bg-active)] text-[var(--crm-text)]'
                        : 'text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)]'
                    )}
                    title="Vista Kanban"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'flex items-center justify-center h-8 w-8 border-l border-[var(--crm-border)] transition-colors',
                      viewMode === 'list'
                        ? 'bg-[var(--crm-bg-active)] text-[var(--crm-text)]'
                        : 'text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)]'
                    )}
                    title="Vista Lista"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Button
                  onClick={fetchLeads}
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  className={cn(
                    'h-8 w-8 p-0 rounded-md text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)]',
                    'crm-focus-ring transition-all',
                    loading && 'animate-spin'
                  )}
                  title="Actualizar"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  onClick={() => setIsNewLeadDialogOpen(true)}
                  size="sm"
                  className="crm-btn-primary gap-1.5 crm-focus-ring"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Nuevo Lead</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              </div>
            </div>

            {/* Row 2: KPI cards */}
            {loading ? <KpiCardsSkeleton /> : <KpiCards leads={leads} />}
          </div>
        </div>

        {/* ─── Main content ─────────────────────────────── */}
        <div className="flex-1 flex flex-col px-4 sm:px-6 py-4">
          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--crm-danger-light)]">
                <AlertTriangle className="h-6 w-6 text-[var(--crm-danger)]" />
              </div>
              <div className="text-center max-w-sm">
                <p className="crm-subtitle font-semibold text-[var(--crm-text)]">Error al cargar datos</p>
                <p className="crm-body mt-1">{error}</p>
              </div>
              <Button onClick={fetchLeads} className="crm-btn-secondary gap-2 mt-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Reintentar
              </Button>
            </div>
          )}

          {/* Empty state (no leads at all) */}
          {!loading && !error && leads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--crm-bg-subtle)]">
                <Inbox className="h-6 w-6 text-[var(--crm-text-muted)]" />
              </div>
              <div className="text-center max-w-sm">
                <p className="crm-subtitle font-semibold text-[var(--crm-text)]">Sin leads aún</p>
                <p className="crm-body mt-1">Creá tu primer lead para empezar a gestionar tu pipeline.</p>
              </div>
              <Button onClick={() => setIsNewLeadDialogOpen(true)} className="crm-btn-primary gap-2 mt-2">
                <Plus className="h-3.5 w-3.5" />
                Crear primer lead
              </Button>
            </div>
          )}

          {/* Normal content */}
          {!error && leads.length > 0 && (
            <>
              <KanbanTopBar
                filters={filters}
                onFiltersChange={setFilters}
                activeFilterCount={activeFilterCount}
                users={users}
              />

              {/* No results with filters */}
              {filteredLeads.length === 0 && hasActiveFilters ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--crm-bg-subtle)]">
                    <Inbox className="h-6 w-6 text-[var(--crm-text-muted)]" />
                  </div>
                  <div className="text-center max-w-sm">
                    <p className="crm-subtitle font-semibold text-[var(--crm-text)]">Sin resultados</p>
                    <p className="crm-body mt-1">No se encontraron leads con los filtros actuales.</p>
                  </div>
                  <Button onClick={() => setFilters(DEFAULT_FILTERS)} className="crm-btn-secondary gap-2 mt-2">
                    Limpiar filtros
                  </Button>
                </div>
              ) : viewMode === 'kanban' ? (
                <KanbanBoard
                  leads={filteredLeads}
                  onUpdateLead={handleUpdateLead}
                  onDeleteLead={handleDeleteLead}
                  onQuickAdd={handleQuickAdd}
                  density="comfortable"
                  isLoading={loading}
                />
              ) : (
                <LeadsListView
                  leads={filteredLeads}
                  onUpdateLead={handleUpdateLead}
                  onDeleteLead={handleDeleteLead}
                />
              )}
            </>
          )}

          {/* Loading skeleton for kanban */}
          {loading && (
            <div className="mt-4">
              <div className="hidden md:grid md:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-[var(--crm-radius-lg)] border border-[var(--crm-border)] bg-[var(--crm-bg-card)] p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="crm-skeleton h-2 w-2 rounded-full" />
                      <div className="crm-skeleton h-3 w-20" />
                      <div className="crm-skeleton h-5 w-5 rounded-full ml-auto" />
                    </div>
                    {Array.from({ length: 2 + (i % 3) }).map((_, j) => (
                      <div key={j} className="rounded-[var(--crm-radius-md)] border border-[var(--crm-border-light)] p-3 space-y-2">
                        <div className="crm-skeleton h-3 w-3/4" />
                        <div className="crm-skeleton h-2.5 w-1/2" />
                        <div className="flex gap-1.5 mt-1">
                          <div className="crm-skeleton h-4 w-14 rounded" />
                          <div className="crm-skeleton h-4 w-10 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
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
