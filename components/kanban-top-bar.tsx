"use client"

import { useState } from 'react'
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { LEAD_SOURCES, MOCK_OWNERS } from '@/lib/types/lead'

export type QuickFilter = 'hoy' | 'vencidos' | 'sin-tarea' | 'alta-prioridad'
export type SortOrder = 'ultima-actividad' | 'proxima-tarea' | 'mayor-monto'

export interface KanbanFilters {
  search: string
  quickFilters: QuickFilter[]
  source: string
  producto: string
  owner: string
  sortOrder: SortOrder
}

export const DEFAULT_FILTERS: KanbanFilters = {
  search: '',
  quickFilters: [],
  source: 'all',
  producto: 'all',
  owner: 'all',
  sortOrder: 'ultima-actividad',
}

const QUICK_FILTERS: Array<{ id: QuickFilter; label: string }> = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'vencidos', label: 'Vencidos' },
  { id: 'sin-tarea', label: 'Sin tarea' },
  { id: 'alta-prioridad', label: 'Prioridad A' },
]

const SORT_OPTIONS: Array<{ id: SortOrder; label: string }> = [
  { id: 'ultima-actividad', label: 'Última actividad' },
  { id: 'proxima-tarea', label: 'Próxima tarea' },
  { id: 'mayor-monto', label: 'Mayor monto' },
]

interface KanbanTopBarProps {
  filters: KanbanFilters
  onFiltersChange: (filters: KanbanFilters) => void
  activeFilterCount: number
}

export function KanbanTopBar({ filters, onFiltersChange, activeFilterCount }: KanbanTopBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  const toggleQuickFilter = (qf: QuickFilter) => {
    const current = filters.quickFilters
    const next = current.includes(qf) ? current.filter((f) => f !== qf) : [...current, qf]
    onFiltersChange({ ...filters, quickFilters: next })
  }

  const clearAll = () => onFiltersChange(DEFAULT_FILTERS)

  const hasAnyFilter =
    filters.search !== '' ||
    filters.quickFilters.length > 0 ||
    filters.source !== 'all' ||
    filters.producto !== 'all' ||
    filters.owner !== 'all'

  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--crm-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar leads…"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="crm-input w-full pl-8 pr-8 crm-focus-ring"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Quick filter chips */}
        <div className="hidden sm:flex items-center gap-1.5">
          {QUICK_FILTERS.map((qf) => {
            const isActive = filters.quickFilters.includes(qf.id)
            return (
              <button
                key={qf.id}
                onClick={() => toggleQuickFilter(qf.id)}
                className={cn(
                  'h-7 px-2.5 rounded-[var(--crm-radius-md)] text-[12px] font-medium whitespace-nowrap border crm-focus-ring',
                  'transition-all duration-[var(--crm-transition)]',
                  isActive
                    ? 'bg-[var(--crm-primary)] text-white border-[var(--crm-primary)]'
                    : 'bg-[var(--crm-bg-card)] text-[var(--crm-text-secondary)] border-[var(--crm-border)] hover:border-[var(--crm-border-hover)] hover:bg-[var(--crm-bg-hover)]'
                )}
              >
                {qf.label}
              </button>
            )
          })}
        </div>

        {/* Sort dropdown */}
        <Select
          value={filters.sortOrder}
          onValueChange={(v) => onFiltersChange({ ...filters, sortOrder: v as SortOrder })}
        >
          <SelectTrigger className="h-8 w-auto gap-1.5 text-[12px] font-medium text-[var(--crm-text-secondary)] border-[var(--crm-border)] bg-[var(--crm-bg-card)] rounded-[var(--crm-radius-md)] px-2.5 crm-focus-ring [&>svg]:hidden">
            <ArrowUpDown className="h-3.5 w-3.5 text-[var(--crm-text-muted)] shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-[13px]">{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced filters popover */}
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-8 px-2.5 gap-1.5 rounded-[var(--crm-radius-md)] border-[var(--crm-border)] text-[12px] font-medium text-[var(--crm-text-secondary)] crm-focus-ring',
                'transition-all duration-[var(--crm-transition)]',
                filtersOpen && 'bg-[var(--crm-bg-active)] border-[var(--crm-border-hover)]',
                activeFilterCount > 0 && 'border-[var(--crm-primary)] text-[var(--crm-text)]'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--crm-primary)] text-[9px] text-white font-bold px-1 crm-mono">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-[var(--crm-text)]">Filtros avanzados</p>
                {hasAnyFilter && (
                  <button
                    onClick={clearAll}
                    className="text-[11px] font-medium text-[var(--crm-danger)] hover:text-red-700 transition-colors"
                  >
                    Limpiar todo
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <label className="crm-label">Canal</label>
                <Select value={filters.source} onValueChange={(v) => onFiltersChange({ ...filters, source: v })}>
                  <SelectTrigger className="h-8 text-[13px] bg-[var(--crm-bg-card)] border-[var(--crm-border)]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {LEAD_SOURCES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="crm-label">Producto</label>
                <Select value={filters.producto} onValueChange={(v) => onFiltersChange({ ...filters, producto: v })}>
                  <SelectTrigger className="h-8 text-[13px] bg-[var(--crm-bg-card)] border-[var(--crm-border)]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="alfajores">Alfajores</SelectItem>
                    <SelectItem value="galletitas">Galletitas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="crm-label">Owner</label>
                <Select value={filters.owner} onValueChange={(v) => onFiltersChange({ ...filters, owner: v })}>
                  <SelectTrigger className="h-8 text-[13px] bg-[var(--crm-bg-card)] border-[var(--crm-border)]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {MOCK_OWNERS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:hidden space-y-1">
                <label className="crm-label">Filtros rápidos</label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FILTERS.map((qf) => {
                    const isActive = filters.quickFilters.includes(qf.id)
                    return (
                      <button
                        key={qf.id}
                        onClick={() => toggleQuickFilter(qf.id)}
                        className={cn(
                          'h-7 px-2.5 rounded-[var(--crm-radius-md)] text-[12px] font-medium border',
                          'transition-all duration-[var(--crm-transition)]',
                          isActive
                            ? 'bg-[var(--crm-primary)] text-white border-[var(--crm-primary)]'
                            : 'bg-[var(--crm-bg-card)] text-[var(--crm-text-secondary)] border-[var(--crm-border)] hover:border-[var(--crm-border-hover)]'
                        )}
                      >
                        {qf.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {hasAnyFilter && (
          <button
            onClick={clearAll}
            className="hidden sm:flex items-center gap-1 h-8 px-2 text-[12px] font-medium text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] transition-colors"
          >
            <X className="h-3 w-3" />
            <span>Limpiar</span>
          </button>
        )}
      </div>
    </div>
  )
}
