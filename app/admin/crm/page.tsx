"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Lead } from '@/lib/types/lead'
import { User } from '@/lib/types/user'
import { KanbanBoard } from '@/components/kanban-board'
import { LeadsListView } from '@/components/leads-list-view'
import { KanbanTopBar, KanbanFilters, DEFAULT_FILTERS } from '@/components/kanban-top-bar'
import { KpiCards, KpiCardsSkeleton } from '@/components/kpi-cards'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus, AlertTriangle, Inbox, LayoutGrid, List, Archive } from 'lucide-react'
import { toast } from 'sonner'
import { NewLeadDialog } from '@/components/new-lead-dialog'
import { ConvertLeadModal } from '@/components/convert-lead-modal'
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

// ─── Client-side filters (for fields NOT in DB) ─────────────────
function applyClientFilters(leads: Lead[], filters: KanbanFilters): Lead[] {
  let result = leads

  for (const qf of filters.quickFilters) {
    switch (qf) {
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

// ─── Build API query string from filters ────────────────────────
function buildLeadsQuery(filters: KanbanFilters): string {
  const params = new URLSearchParams()

  if (filters.search.trim()) params.set('search', filters.search.trim())
  if (filters.producto !== 'all') params.set('producto', filters.producto)
  if (filters.owner !== 'all') params.set('owner', filters.owner)
  if (filters.quickFilters.includes('hoy')) params.set('createdToday', 'true')

  switch (filters.sortOrder) {
    case 'ultima-actividad':
      params.set('sortBy', 'updated')
      params.set('sortDir', 'desc')
      break
    case 'mayor-monto':
      params.set('sortBy', 'monto')
      params.set('sortDir', 'desc')
      break
  }

  params.set('limit', '500')
  const qs = params.toString()
  return qs ? `/api/leads?${qs}` : '/api/leads'
}

// ─── Page ───────────────────────────────────────────────────────
export default function CRMPage() {
  const router = useRouter()
  const [rawLeads, setRawLeads] = useState<Lead[]>([])
  const [totalLeads, setTotalLeads] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false)
  const [filters, setFilters] = useState<KanbanFilters>(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [convertLead, setConvertLead] = useState<Lead | null>(null)
  const [showConverted, setShowConverted] = useState(false)
  const [convertedLeads, setConvertedLeads] = useState<Lead[]>([])

  // Debounce ref for search
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastFiltersRef = useRef<string>('')

  const leads = useMemo(() => rawLeads.map(enrichLead), [rawLeads])

  // Client-side filters for fields not in DB (source, vencidos, sin-tarea, alta-prioridad)
  const filteredLeads = useMemo(() => applyClientFilters(leads, filters), [leads, filters])

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters])
  const hasActiveFilters = activeFilterCount > 0

  // Fetch leads with server-side filters
  const fetchLeads = useCallback(async (currentFilters?: KanbanFilters) => {
    const f = currentFilters || filters
    const url = buildLeadsQuery(f)

    // Avoid duplicate fetches for same params
    if (lastFiltersRef.current === url && rawLeads.length > 0) return
    lastFiltersRef.current = url

    setError(null)
    setLoading(true)
    try {
      const [leadsRes, usersRes] = await Promise.all([
        fetch(url),
        fetch('/api/users'),
      ])
      if (leadsRes.ok) {
        const data = await leadsRes.json()
        setRawLeads(data.leads || [])
        setTotalLeads(data.total || data.leads?.length || 0)
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
  }, [filters, rawLeads.length])

  // Initial load
  useEffect(() => { fetchLeads() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when server-side filters change (debounced for search)
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)

    searchTimerRef.current = setTimeout(() => {
      lastFiltersRef.current = '' // Force re-fetch
      fetchLeads(filters)
    }, filters.search ? 350 : 0) // 350ms debounce for search, instant for other filters

    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [filters.search, filters.producto, filters.owner, filters.sortOrder, filters.quickFilters]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    lastFiltersRef.current = ''
    fetchLeads(filters)
  }

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    if (updates.stage === 'ganado') {
      const lead = rawLeads.find((l) => l.id === leadId)
      if (lead && lead.stage !== 'ganado') {
        setConvertLead(lead)
        return
      }
    }

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

  const handleLeadConverted = (accountId: string) => {
    if (convertLead) {
      setRawLeads((prev) => prev.filter((l) => l.id !== convertLead.id))
    }
    setConvertLead(null)
    router.push(`/admin/cuentas/${accountId}`)
  }

  const fetchConvertedLeads = async () => {
    try {
      const res = await fetch('/api/leads?converted=true&limit=100')
      if (res.ok) {
        const data = await res.json()
        setConvertedLeads(data.leads || [])
      }
    } catch { /* ignore */ }
  }

  const toggleShowConverted = () => {
    const next = !showConverted
    setShowConverted(next)
    if (next) fetchConvertedLeads()
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

  const handleQuickAdd = () => {
    setIsNewLeadDialogOpen(true)
  }

  return (
    <div className="min-h-screen crm-surface flex">
      <CRMSidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-[72px] md:pb-0 overflow-x-hidden">
        {/* ─── Sticky header ───────────────────────────── */}
        <div className="crm-header sticky top-0 z-10 shrink-0">
          <div className="px-3 sm:px-6 py-2.5 sm:py-4">
            {/* Row 1: Title + Actions */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
              <div className="min-w-0">
                <h1 className="crm-title text-[16px] sm:text-[18px]">Leads</h1>
                <p className="crm-meta crm-mono mt-0.5 text-[10px] sm:text-[11px]">
                  {loading ? (
                    <span className="crm-skeleton inline-block w-16 h-3" />
                  ) : filteredLeads.length === totalLeads ? (
                    `${totalLeads} leads`
                  ) : (
                    <>Mostrando {filteredLeads.length} de {totalLeads}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {/* Converted toggle */}
                <button
                  onClick={toggleShowConverted}
                  className={cn(
                    'flex items-center gap-1 h-8 px-2 rounded-md text-[11px] font-medium transition-colors',
                    showConverted
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)]'
                  )}
                  title="Ver leads convertidos"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{showConverted ? 'Activos' : 'Convertidos'}</span>
                </button>

                {/* View mode toggle */}
                <div className="flex items-center rounded-[var(--crm-radius-md)] border border-[var(--crm-border)] overflow-hidden">
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
                  onClick={handleRefresh}
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
        <div className="flex-1 flex flex-col px-3 sm:px-6 py-3 sm:py-4">
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
              <Button onClick={handleRefresh} className="crm-btn-secondary gap-2 mt-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Reintentar
              </Button>
            </div>
          )}

          {/* Empty state (no leads at all) */}
          {!loading && !error && totalLeads === 0 && !showConverted && (
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

          {/* Converted leads view */}
          {showConverted && !loading && !error && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Archive className="h-4 w-4 text-emerald-600" />
                <h2 className="text-[14px] font-semibold text-[var(--crm-text)]">Leads convertidos</h2>
                <span className="text-[11px] crm-mono text-[var(--crm-text-muted)]">({convertedLeads.length})</span>
              </div>
              {convertedLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--crm-bg-subtle)]">
                    <Archive className="h-5 w-5 text-[var(--crm-text-muted)]" />
                  </div>
                  <p className="text-[13px] text-[var(--crm-text-muted)]">No hay leads convertidos aún</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {convertedLeads.map((lead) => (
                    <div key={lead.id} className="bg-[var(--crm-bg-card)] border border-[var(--crm-border-light)] rounded-lg p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[var(--crm-text)] truncate">{lead.nombre}</p>
                          <p className="text-[12px] text-[var(--crm-text-secondary)]">{lead.empresa}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                          Convertido
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-[var(--crm-text-muted)]">
                        <span>{lead.email}</span>
                        <span>{lead.telefono}</span>
                        {lead.convertedAt && (
                          <span>Convertido: {new Date(lead.convertedAt).toLocaleDateString('es-AR')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Normal content */}
          {!error && (totalLeads > 0 || hasActiveFilters) && !showConverted && (
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

          {/* Loading skeleton */}
          {loading && (
            <div className="mt-3 sm:mt-4">
              <div className="md:hidden space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-[var(--crm-radius-md)] border border-[var(--crm-border-light)] bg-[var(--crm-bg-card)] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="crm-skeleton h-2 w-2 rounded-full" />
                      <div className="crm-skeleton h-3 w-32" />
                      <div className="crm-skeleton h-4 w-8 rounded ml-auto" />
                    </div>
                    <div className="crm-skeleton h-2.5 w-24 ml-4" />
                    <div className="flex gap-1.5 ml-4">
                      <div className="crm-skeleton h-4 w-14 rounded" />
                      <div className="crm-skeleton h-4 w-10 rounded" />
                    </div>
                  </div>
                ))}
              </div>
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
          onLeadCreated={() => { lastFiltersRef.current = ''; fetchLeads(filters) }}
        />

        <ConvertLeadModal
          lead={convertLead}
          open={!!convertLead}
          onOpenChange={(open) => { if (!open) setConvertLead(null) }}
          onConverted={handleLeadConverted}
        />
      </div>
    </div>
  )
}
