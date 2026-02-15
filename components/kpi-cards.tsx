"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Clock, Percent } from 'lucide-react'
import { Lead } from '@/lib/types/lead'

// ─── Tipos ──────────────────────────────────────────────────────
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
    const diffH = Math.max(0, (firstContact - created) / (1000 * 60 * 60))
    return sum + diffH
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
  iconBg: string
  iconColor: string
  valueColor: string
  getValue: (leads: Lead[]) => string
}

const KPI_CONFIG: KpiConfig[] = [
  {
    key: 'total',
    label: 'Total Leads',
    icon: Users,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    valueColor: 'text-gray-900',
    getValue: (leads) => String(leads.length),
  },
  {
    key: 'ganados',
    label: 'Ganados',
    icon: TrendingUp,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    valueColor: 'text-green-600',
    getValue: (leads) => String(leads.filter((l) => l.stage === 'ganado').length),
  },
  {
    key: 'conversion',
    label: 'Tasa Conversión',
    icon: Percent,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    valueColor: 'text-purple-600',
    getValue: (leads) => {
      if (leads.length === 0) return '0%'
      const ganados = leads.filter((l) => l.stage === 'ganado').length
      return `${((ganados / leads.length) * 100).toFixed(1)}%`
    },
  },
  {
    key: 'avg-first-contact',
    label: 'Prom. 1er Contacto',
    icon: Clock,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    valueColor: 'text-amber-600',
    getValue: (leads) => calcAvgFirstContact(leads),
  },
]

// ─── Componente ─────────────────────────────────────────────────
export function KpiCards({ leads }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {KPI_CONFIG.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card
            key={kpi.key}
            className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden"
          >
            <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-2 px-3 pt-4 sm:pt-5">
              <div className={`${kpi.iconBg} rounded-full p-2.5 sm:p-3 mb-2`}>
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${kpi.iconColor}`} />
              </div>
              <CardTitle className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase tracking-wide text-center leading-tight">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-4 sm:pb-5 flex items-center justify-center">
              <div className={`text-xl sm:text-2xl font-bold ${kpi.valueColor}`}>
                {kpi.getValue(leads)}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
