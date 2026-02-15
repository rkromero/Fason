"use client"

import { useState } from 'react'
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { LEAD_SOURCES, MOCK_OWNERS, type LeadSource } from '@/lib/types/lead'

// ─── Tipos ──────────────────────────────────────────────────────
export type QuickFilter = 'hoy' | 'vencidos' | 'sin-tarea' | 'alta-prioridad'

export type SortOrder = 'ultima-actividad' | 'proxima-tarea' | 'mayor-monto'

export interface KanbanFilters {
  search: string
  quickFilters: QuickFilter[]
  source: string       // 'all' | LeadSource
  producto: string     // 'all' | 'alfajores' | 'galletitas'
  owner: string        // 'all' | owner name
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

// ─── Quick Filter chips config ──────────────────────────────────
const QUICK_FILTER_CONFIG: Array<{ id: QuickFilter; label: string; icon: string }> = [
  { id: 'hoy', label: 'Hoy', icon: '📅' },
  { id: 'vencidos', label: 'Vencidos', icon: '⚠️' },
  { id: 'sin-tarea', label: 'Sin próxima tarea', icon: '📋' },
  { id: 'alta-prioridad', label: 'Alta prioridad', icon: '🔥' },
]

const SORT_OPTIONS: Array<{ id: SortOrder; label: string }> = [
  { id: 'ultima-actividad', label: 'Última actividad' },
  { id: 'proxima-tarea', label: 'Próxima tarea' },
  { id: 'mayor-monto', label: 'Mayor monto' },
]

// ─── Componente ─────────────────────────────────────────────────
interface KanbanTopBarProps {
  filters: KanbanFilters
  onFiltersChange: (filters: KanbanFilters) => void
  activeFilterCount: number
}

export function KanbanTopBar({ filters, onFiltersChange, activeFilterCount }: KanbanTopBarProps) {
  const [showFilters, setShowFilters] = useState(false)

  const toggleQuickFilter = (qf: QuickFilter) => {
    const current = filters.quickFilters
    const next = current.includes(qf)
      ? current.filter((f) => f !== qf)
      : [...current, qf]
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
      {/* Fila principal: search + toggle filtros */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, empresa, email, teléfono o tag…"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9 pr-9 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white rounded-lg"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Toggle filtros avanzados */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'h-9 px-3 gap-1.5 rounded-lg border-gray-200 text-sm font-medium transition-all',
            showFilters && 'bg-blue-50 border-blue-300 text-blue-700'
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={cn('h-3 w-3 transition-transform', showFilters && 'rotate-180')} />
        </Button>

        {/* Limpiar filtros */}
        {hasAnyFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-9 px-3 text-sm text-gray-500 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Quick filter chips – siempre visibles */}
      <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {QUICK_FILTER_CONFIG.map((qf) => {
          const isActive = filters.quickFilters.includes(qf.id)
          return (
            <button
              key={qf.id}
              onClick={() => toggleQuickFilter(qf.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              )}
            >
              <span className="text-xs">{qf.icon}</span>
              {qf.label}
            </button>
          )
        })}
      </div>

      {/* Panel de filtros avanzados */}
      {showFilters && (
        <div className="border-t border-gray-100 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/50 rounded-b-xl">
          {/* Canal */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Canal</label>
            <Select
              value={filters.source}
              onValueChange={(v) => onFiltersChange({ ...filters, source: v })}
            >
              <SelectTrigger className="h-8 text-xs bg-white">
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
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Producto</label>
            <Select
              value={filters.producto}
              onValueChange={(v) => onFiltersChange({ ...filters, producto: v })}
            >
              <SelectTrigger className="h-8 text-xs bg-white">
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
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Owner</label>
            <Select
              value={filters.owner}
              onValueChange={(v) => onFiltersChange({ ...filters, owner: v })}
            >
              <SelectTrigger className="h-8 text-xs bg-white">
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

          {/* Orden */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Ordenar por</label>
            <Select
              value={filters.sortOrder}
              onValueChange={(v) => onFiltersChange({ ...filters, sortOrder: v as SortOrder })}
            >
              <SelectTrigger className="h-8 text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
