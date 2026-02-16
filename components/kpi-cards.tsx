"use client"

import { Users, TrendingUp, Clock, Percent, AlertCircle } from 'lucide-react'
import { Lead, getOverdueTaskCount } from '@/lib/types/lead'
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
    return sum + Math.max(0, (firstContact - created) / 3600000)
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
  alert?: (leads: Lead[]) => boolean
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
    key: 'overdue',
    label: 'Vencidas',
    icon: AlertCircle,
    accent: 'bg-[var(--crm-danger-light)]',
    iconColor: 'text-[var(--crm-danger)]',
    getValue: (leads) => {
      const count = leads.reduce((sum, l) => sum + getOverdueTaskCount(l), 0)
      return String(count)
    },
    alert: (leads) => leads.some((l) => getOverdueTaskCount(l) > 0),
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
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2.5">
      {KPI_CONFIG.map((kpi) => {
        const Icon = kpi.icon
        const isAlert = kpi.alert?.(leads)
        return (
          <div
            key={kpi.key}
            className={cn(
              'crm-card flex items-center gap-2 sm:gap-3 px-2 py-2 sm:px-3 sm:py-2.5 group',
              isAlert && 'border-red-200'
            )}
          >
            <div className={cn('flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-[var(--crm-radius-md)] shrink-0 transition-transform group-hover:scale-105', kpi.accent)}>
              <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', kpi.iconColor)} />
            </div>
            <div className="min-w-0">
              <p className="crm-label truncate text-[9px] sm:text-[10px]">{kpi.label}</p>
              <p className={cn('crm-value text-[15px] sm:text-[18px]', isAlert && 'text-[var(--crm-danger)]')}>{kpi.getValue(leads)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="crm-card flex items-center gap-2 sm:gap-3 px-2 py-2 sm:px-3 sm:py-2.5">
          <div className="crm-skeleton h-7 w-7 sm:h-8 sm:w-8 rounded-[var(--crm-radius-md)] shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="crm-skeleton h-2.5 w-16" />
            <div className="crm-skeleton h-5 w-10" />
          </div>
        </div>
      ))}
    </div>
  )
}
