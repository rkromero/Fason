"use client"

import { memo, useMemo } from 'react'
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
  shortLabel: string
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
    shortLabel: 'Total',
    icon: Users,
    accent: 'bg-[var(--crm-info-light)]',
    iconColor: 'text-[var(--crm-info)]',
    getValue: (leads) => String(leads.length),
  },
  {
    key: 'ganados',
    label: 'Ganados',
    shortLabel: 'Ganados',
    icon: TrendingUp,
    accent: 'bg-[var(--crm-success-light)]',
    iconColor: 'text-[var(--crm-success)]',
    getValue: (leads) => String(leads.filter((l) => l.stage === 'ganado').length),
  },
  {
    key: 'conversion',
    label: 'Conversión',
    shortLabel: 'Conv.',
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
    shortLabel: 'Venc.',
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
    shortLabel: '1er C.',
    icon: Clock,
    accent: 'bg-[var(--crm-warning-light)]',
    iconColor: 'text-[var(--crm-warning)]',
    getValue: (leads) => calcAvgFirstContact(leads),
  },
]

export const KpiCards = memo(function KpiCards({ leads }: KpiCardsProps) {
  // Pre-compute values once to avoid recalculating in each KPI card render
  const kpiValues = useMemo(() => {
    return KPI_CONFIG.map((kpi) => ({
      key: kpi.key,
      value: kpi.getValue(leads),
      isAlert: kpi.alert?.(leads) ?? false,
    }))
  }, [leads])

  return (
    <>
      {/* Mobile: 5 KPIs in one row, ultra compact */}
      <div className="flex sm:hidden gap-1.5">
        {KPI_CONFIG.map((kpi, i) => {
          const { isAlert, value } = kpiValues[i]
          return (
            <div
              key={kpi.key}
              className={cn(
                'flex-1 min-w-0 rounded-lg border border-[var(--crm-border-light)] bg-[var(--crm-bg-card)] px-1.5 py-1.5 text-center',
                isAlert && 'border-red-200'
              )}
            >
              <p className={cn('text-[14px] font-bold leading-tight crm-mono', isAlert ? 'text-[var(--crm-danger)]' : 'text-[var(--crm-text)]')}>
                {value}
              </p>
              <p className="text-[8px] font-medium text-[var(--crm-text-muted)] uppercase tracking-wide leading-tight mt-0.5 truncate">
                {kpi.shortLabel}
              </p>
            </div>
          )
        })}
      </div>

      {/* Desktop: full cards with icons */}
      <div className="hidden sm:grid sm:grid-cols-5 gap-2.5">
        {KPI_CONFIG.map((kpi, i) => {
          const Icon = kpi.icon
          const { isAlert, value } = kpiValues[i]
          return (
            <div
              key={kpi.key}
              className={cn(
                'crm-card flex items-center gap-3 px-3 py-2.5 group',
                isAlert && 'border-red-200'
              )}
            >
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-[var(--crm-radius-md)] shrink-0 transition-transform group-hover:scale-105', kpi.accent)}>
                <Icon className={cn('h-4 w-4', kpi.iconColor)} />
              </div>
              <div className="min-w-0">
                <p className="crm-label truncate">{kpi.label}</p>
                <p className={cn('crm-value text-[18px]', isAlert && 'text-[var(--crm-danger)]')}>{value}</p>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
})

export function KpiCardsSkeleton() {
  return (
    <>
      {/* Mobile skeleton */}
      <div className="flex sm:hidden gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 min-w-0 rounded-lg border border-[var(--crm-border-light)] bg-[var(--crm-bg-card)] px-1.5 py-1.5 text-center">
            <div className="crm-skeleton h-4 w-8 mx-auto mb-1" />
            <div className="crm-skeleton h-2 w-10 mx-auto" />
          </div>
        ))}
      </div>

      {/* Desktop skeleton */}
      <div className="hidden sm:grid sm:grid-cols-5 gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="crm-card flex items-center gap-3 px-3 py-2.5">
            <div className="crm-skeleton h-8 w-8 rounded-[var(--crm-radius-md)] shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="crm-skeleton h-2.5 w-16" />
              <div className="crm-skeleton h-5 w-10" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
