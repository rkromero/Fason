"use client"

import { useState, useEffect } from 'react'
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
import { SidebarContent } from '@/components/sidebar-layout'
import { cn } from '@/lib/utils'
import { useLeads } from '@/hooks/use-leads'
import { useQuery } from '@tanstack/react-query'

// ─── Page ───────────────────────────────────────────────────────
export default function CRMPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<KanbanFilters>(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')

  // Default to list view on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode('list')
    }
  }, [])
  const [convertLead, setConvertLead] = useState<Lead | null>(null)
  const [showConverted, setShowConverted] = useState(false)
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false)

  // Use the custom hook for leads
  const {
    leads,
    totalLeads,
    isLoading,
    error,
    refetch,
    updateLead,
    deleteLead,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useLeads(filters)

  // Fetch users (kept separate for now, could be its own hook)
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Error al cargar usuarios')
      const data = await res.json()
      return (data.users || []).filter((u: User) => u.activo)
    },
    staleTime: 600000, // 10 minutes
  })

  // Converted leads fetch (simple implementation for now)
  const { data: convertedLeads = [] } = useQuery<Lead[]>({
    queryKey: ['leads', 'converted'],
    queryFn: async () => {
      const res = await fetch('/api/leads?converted=true&limit=100')
      if (!res.ok) return []
      const data = await res.json()
      return data.leads || []
    },
    enabled: showConverted,
  })

  const activeFilterCount = (() => {
    let count = 0
    if (filters.search) count++
    count += filters.quickFilters.length
    if (filters.source !== 'all') count++
    if (filters.producto !== 'all') count++
    if (filters.owner !== 'all') count++
    return count
  })()

  const hasActiveFilters = activeFilterCount > 0

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    if (updates.stage === 'ganado') {
      const lead = leads.find((l) => l.id === leadId)
      if (lead && lead.stage !== 'ganado') {
        setConvertLead(lead)
        return
      }
    }
    await updateLead({ id: leadId, updates })
  }

  const handleDeleteLead = async (leadId: string) => {
    await deleteLead(leadId)
  }

  const handleLeadConverted = (accountId: string) => {
    setConvertLead(null)
    router.push(`/admin/cuentas/${accountId}`)
    refetch()
  }

  const handleQuickAdd = () => {
    setIsNewLeadDialogOpen(true)
  }

  return (
    <div className="min-h-screen crm-surface flex">
      <CRMSidebar />

      <SidebarContent>
        {/* ─── Sticky header ───────────────────────────── */}
        <header className="crm-header sticky top-0 z-10 shrink-0">
          <div className="px-3 sm:px-6 py-2.5 sm:py-4">
            {/* Row 1: Title + Actions */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
              <div className="min-w-0">
                <h1 className="crm-title text-[16px] sm:text-[18px]">Leads</h1>
                <p className="crm-meta crm-mono mt-0.5 text-[10px] sm:text-[11px]">
                  {isLoading ? (
                    <span className="crm-skeleton inline-block w-16 h-3" />
                  ) : leads.length === totalLeads ? (
                    `${totalLeads} leads`
                  ) : (
                    <>Mostrando {leads.length} de {totalLeads}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {/* Converted toggle */}
                <button
                  onClick={() => setShowConverted(!showConverted)}
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
                <div className="flex items-center rounded-[var(--crm-radius-md)] border border-[var(--crm-border)] overflow-hidden" role="group" aria-label="Cambiar vista">
                  <button
                    onClick={() => setViewMode('kanban')}
                    aria-label="Vista Kanban"
                    aria-pressed={viewMode === 'kanban'}
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
                    aria-label="Vista Lista"
                    aria-pressed={viewMode === 'list'}
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
                  onClick={() => refetch()}
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  aria-label="Actualizar leads"
                  className={cn(
                    'h-8 w-8 p-0 rounded-md text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)]',
                    'crm-focus-ring transition-all',
                    isLoading && 'animate-spin'
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
            {isLoading ? <KpiCardsSkeleton /> : <KpiCards leads={leads} />}
          </div>
        </header>

        {/* ─── Main content ─────────────────────────────── */}
        <div className="flex-1 flex flex-col px-3 sm:px-6 py-3 sm:py-4">
          {/* Error state */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--crm-danger-light)]">
                <AlertTriangle className="h-6 w-6 text-[var(--crm-danger)]" />
              </div>
              <div className="text-center max-w-sm">
                <p className="crm-subtitle font-semibold text-[var(--crm-text)]">Error al cargar datos</p>
                <p className="crm-body mt-1">No se pudieron cargar los leads.</p>
              </div>
              <Button onClick={() => refetch()} className="crm-btn-secondary gap-2 mt-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Reintentar
              </Button>
            </div>
          )}

          {/* Empty state (no leads at all) */}
          {!isLoading && !error && totalLeads === 0 && !showConverted && (
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
          {showConverted && !isLoading && !error && (
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
          {!error && !showConverted && (
            <>
              {(totalLeads > 0 || hasActiveFilters || isLoading) && (
                <KanbanTopBar
                  filters={filters}
                  onFiltersChange={setFilters}
                  activeFilterCount={activeFilterCount}
                  users={users}
                />
              )}

              {/* No results with filters */}
              {!isLoading && leads.length === 0 && hasActiveFilters ? (
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
                  leads={leads}
                  onUpdateLead={handleUpdateLead}
                  onDeleteLead={handleDeleteLead}
                  onQuickAdd={handleQuickAdd}
                  density="comfortable"
                  isLoading={isLoading}
                />
              ) : (
                isLoading ? (
                  <div className="space-y-2 mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="rounded-[var(--crm-radius-md)] border border-[var(--crm-border-light)] bg-[var(--crm-bg-card)] p-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="crm-skeleton h-2 w-2 rounded-full" />
                          <div className="crm-skeleton h-4 w-32" />
                          <div className="crm-skeleton h-4 w-12 rounded ml-auto" />
                        </div>
                        <div className="crm-skeleton h-2.5 w-24 ml-5" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <LeadsListView
                    leads={leads}
                    onUpdateLead={handleUpdateLead}
                    onDeleteLead={handleDeleteLead}
                  />
                )
              )}

              {/* Load More Button */}
              {!isLoading && !error && hasNextPage && !showConverted && (
                <div className="py-4 flex justify-center w-full">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="gap-2"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Cargando más...
                      </>
                    ) : (
                      <>
                        Cargar más leads
                        <span className="text-xs text-muted-foreground ml-1">
                          ({leads.length} de {totalLeads})
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <NewLeadDialog
          open={isNewLeadDialogOpen}
          onOpenChange={setIsNewLeadDialogOpen}
          onLeadCreated={() => refetch()}
        />

        <ConvertLeadModal
          lead={convertLead}
          open={!!convertLead}
          onOpenChange={(open) => { if (!open) setConvertLead(null) }}
          onConverted={handleLeadConverted}
        />
      </SidebarContent>
    </div>
  )
}
