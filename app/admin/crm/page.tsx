"use client"

import { useState, useEffect } from 'react'
import { Lead } from '@/lib/types/lead'
import { KanbanBoard } from '@/components/kanban-board'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function CRMPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads)
      } else {
        toast.error('Error al cargar los leads')
      }
    } catch (error) {
      console.error('Error al obtener leads:', error)
      toast.error('Error al cargar los leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const data = await response.json()
        setLeads((prevLeads) =>
          prevLeads.map((lead) => (lead.id === leadId ? data.lead : lead))
        )
        toast.success('Lead actualizado correctamente')
      } else {
        toast.error('Error al actualizar el lead')
      }
    } catch (error) {
      console.error('Error al actualizar lead:', error)
      toast.error('Error al actualizar el lead')
    }
  }

  // Calcular estadísticas
  const stats = {
    total: leads.length,
    ganados: leads.filter((lead) => lead.stage === 'ganado').length,
  }

  const conversionRate = stats.total > 0 ? ((stats.ganados / stats.total) * 100).toFixed(1) : '0'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">CRM - Gestión de Leads</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Tablero Kanban para gestionar tus leads de ventas
              </p>
            </div>
            <Button 
              onClick={fetchLeads} 
              variant="outline" 
              size="sm"
              className="w-full sm:w-auto shrink-0"
            >
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Total Leads</CardTitle>
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0 ml-1" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Ganados</CardTitle>
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0 ml-1" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{stats.ganados}</div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Tasa Conversión</CardTitle>
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 shrink-0 ml-1" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-xl md:text-2xl font-bold">{conversionRate}%</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tablero Kanban */}
      <div className="w-full px-2 sm:px-4 py-4 sm:py-6 md:py-4 md:px-4 lg:px-6">
        <KanbanBoard leads={leads} onUpdateLead={handleUpdateLead} />
      </div>
    </div>
  )
}

