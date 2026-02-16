"use client"

import { Users, TrendingUp, Clock, Percent } from 'lucide-react'
import { Lead } from '@/lib/types/lead'
import { cn } from '@/lib/utils'

interface KpiCardsProps {
  leads: Lead[]
}

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

interface KpiConfig {
  key: string
  label: string
  icon: typeof Users
  accent: string
  iconColor: string
  getValue: (leads: Lead[]) => string
}

const KPI_CONFIG: KpiConfig[] = [
  {
    key: 'total',
    label: 'Total Leads',
    icon: Users,
    accent: 'bg-[var(--crm-info-light)]',
    iconColor: 'text-[var(--crm-info)]',
    getValue: (leads) => String(leads.length),
  },
  {
    key: 'ganados',
    label: 'Ganados',
    icon: TrendingUp,
    accent: 'bg-[var(--crm-success-light)]',
    iconColor: 'text-[var(--crm-success)]',
    getValue: (leads) => String(leads.filter((l) => l.stage === 'ganado').length),
  },
  {
    key: 'conversion',
    label: 'Conversión',
    icon: Percent,
    accent: 'bg-violet-50',
    iconColor: 'text-violet-600',
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
    accent: 'bg-[var(--crm-warning-light)]',
    iconColor: 'text-[var(--crm-warning)]',
    getValue: (leads) => calcAvgFirstContact(leads),
  },
]

export function KpiCards({ leads }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {KPI_CONFIG.map((kpi) => {
        const Icon = kpi.icon
        return (
          <div
            key={kpi.key}
            className="crm-card flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 group"
          >
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-[var(--crm-radius-md)] shrink-0 transition-transform group-hover:scale-105', kpi.accent)}>
              <Icon className={cn('h-4 w-4', kpi.iconColor)} />
            </div>
            <div className="min-w-0">
              <p className="crm-label truncate">{kpi.label}</p>
              <p className="crm-value">{kpi.getValue(leads)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="crm-card flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="crm-skeleton h-8 w-8 rounded-[var(--crm-radius-md)] shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="crm-skeleton h-2.5 w-16" />
            <div className="crm-skeleton h-5 w-10" />
          </div>
        </div>
      ))}
    </div>
  )
}
