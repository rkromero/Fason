"use client"

import { Users, TrendingUp, Clock, Percent } from 'lucide-react'
import { Lead } from '@/lib/types/lead'
import { cn } from '@/lib/utils'

interface KpiCardsProps {
  leads: Lead[]
}

// ─── Helpers ────────────────────────────────────────────────────
function calcAvgFirstContact(leads: Lead[]): string {
  const leadsWithFirst = leads.filter((l) => l.firstContactDate && l.createdAt)
  if (leadsWithFirst.length === 0) return '—'
  const totalHours = leadsWithFirst.reduce((sum, l) => {
    const created = new Date(l.createdAt).getTime()
    const firstContact = new Date(l.firstContactDate!).getTime()
    return sum + Math.max(0, (firstContact - created) / (1000 * 60 * 60))
  }, 0)
  const avg = totalHours / leadsWithFirst.length
  if (avg < 1) return `${Math.round(avg * 60)}min`
  if (avg < 24) return `${avg.toFixed(1)}h`
  return `${(avg / 24).toFixed(1)}d`
}

// ─── KPI config ─────────────────────────────────────────────────
interface KpiConfig {
  key: string
  label: string
  icon: typeof Users
  accent: string
  getValue: (leads: Lead[]) => string
}

const KPI_CONFIG: KpiConfig[] = [
  {
    key: 'total',
    label: 'Total Leads',
    icon: Users,
    accent: 'text-blue-600 bg-blue-50',
    getValue: (leads) => String(leads.length),
  },
  {
    key: 'ganados',
    label: 'Ganados',
    icon: TrendingUp,
    accent: 'text-emerald-600 bg-emerald-50',
    getValue: (leads) => String(leads.filter((l) => l.stage === 'ganado').length),
  },
  {
    key: 'conversion',
    label: 'Conversión',
    icon: Percent,
    accent: 'text-violet-600 bg-violet-50',
    getValue: (leads) => {
      if (leads.length === 0) return '0%'
      const ganados = leads.filter((l) => l.stage === 'ganado').length
      return `${((ganados / leads.length) * 100).toFixed(1)}%`
    },
  },
  {
    key: 'avg-first-contact',
    label: '1er Contacto',
    icon: Clock,
    accent: 'text-amber-600 bg-amber-50',
    getValue: (leads) => calcAvgFirstContact(leads),
  },
]

// ─── Component ──────────────────────────────────────────────────
export function KpiCards({ leads }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {KPI_CONFIG.map((kpi) => {
        const Icon = kpi.icon
        const [iconText, iconBg] = kpi.accent.split(' ')
        return (
          <div
            key={kpi.key}
            className="flex items-center gap-3 rounded-lg border border-gray-200/80 bg-white px-3 py-2.5 sm:px-4 sm:py-3"
          >
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', iconBg)}>
              <Icon className={cn('h-4 w-4', iconText)} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider truncate">
                {kpi.label}
              </p>
              <p className="text-lg font-semibold text-gray-900 leading-tight tabular-nums tracking-tight">
                {kpi.getValue(leads)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
