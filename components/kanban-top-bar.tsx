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

// ─── Types ──────────────────────────────────────────────────────
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

// ─── Component ──────────────────────────────────────────────────
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
      {/* Main toolbar row */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar leads…"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="crm-input w-full pl-8 pr-8"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                  'h-7 px-2.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-all border crm-focus-ring',
                  isActive
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
          <SelectTrigger className="h-8 w-auto gap-1.5 text-[12px] font-medium text-gray-600 border-gray-200 bg-white rounded-md px-2.5 [&>svg]:hidden">
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
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
                'h-8 px-2.5 gap-1.5 rounded-md border-gray-200 text-[12px] font-medium text-gray-600',
                filtersOpen && 'bg-gray-100 border-gray-300',
                activeFilterCount > 0 && 'border-gray-900 text-gray-900'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gray-900 text-[9px] text-white font-bold px-1">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-gray-900">Filtros avanzados</p>
                {hasAnyFilter && (
                  <button
                    onClick={clearAll}
                    className="text-[11px] font-medium text-red-500 hover:text-red-600 transition-colors"
                  >
                    Limpiar todo
                  </button>
                )}
              </div>

              {/* Canal */}
              <div className="space-y-1">
                <label className="crm-label">Canal</label>
                <Select
                  value={filters.source}
                  onValueChange={(v) => onFiltersChange({ ...filters, source: v })}
                >
                  <SelectTrigger className="h-8 text-[13px] bg-white border-gray-200">
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

              {/* Producto */}
              <div className="space-y-1">
                <label className="crm-label">Producto</label>
                <Select
                  value={filters.producto}
                  onValueChange={(v) => onFiltersChange({ ...filters, producto: v })}
                >
                  <SelectTrigger className="h-8 text-[13px] bg-white border-gray-200">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="alfajores">Alfajores</SelectItem>
                    <SelectItem value="galletitas">Galletitas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Owner */}
              <div className="space-y-1">
                <label className="crm-label">Owner</label>
                <Select
                  value={filters.owner}
                  onValueChange={(v) => onFiltersChange({ ...filters, owner: v })}
                >
                  <SelectTrigger className="h-8 text-[13px] bg-white border-gray-200">
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

              {/* Mobile quick filters */}
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
                          'h-7 px-2.5 rounded-md text-[12px] font-medium transition-all border',
                          isActive
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
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

        {/* Clear all (desktop) */}
        {hasAnyFilter && (
          <button
            onClick={clearAll}
            className="hidden sm:flex items-center gap-1 h-8 px-2 text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-3 w-3" />
            <span>Limpiar</span>
          </button>
        )}
      </div>
    </div>
  )
}
