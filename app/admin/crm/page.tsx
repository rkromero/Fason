"use client"

import { useState, useEffect } from 'react'
import { Lead } from '@/lib/types/lead'
import { KanbanBoard } from '@/components/kanban-board'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, Users, DollarSign } from 'lucide-react'
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
    inversionTotal: leads.reduce((sum, lead) => {
      if (lead.inversionEstimada) {
        const numStr = lead.inversionEstimada.replace(/[^0-9]/g, '')
        return sum + parseInt(numStr) || 0
      }
      return sum
    }, 0),
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
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">CRM - Gestión de Leads</h1>
              <p className="text-muted-foreground mt-1">
                Tablero Kanban para gestionar tus leads de ventas
              </p>
            </div>
            <Button onClick={fetchLeads} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ganados</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.ganados}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa Conversión</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionRate}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inversión Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.inversionTotal.toLocaleString('es-AR')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tablero Kanban */}
      <div className="container mx-auto px-4 py-8">
        <KanbanBoard leads={leads} onUpdateLead={handleUpdateLead} />
      </div>
    </div>
  )
}

