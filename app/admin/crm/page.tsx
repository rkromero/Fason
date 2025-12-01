"use client"

import { useState, useEffect } from 'react'
import { Lead } from '@/lib/types/lead'
import { KanbanBoard } from '@/components/kanban-board'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, Users, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { NewLeadDialog } from '@/components/new-lead-dialog'

export default function CRMPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false)

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
    <div className="min-h-screen bg-gray-50">
      {/* Header Material Design */}
      <div className="bg-white sticky top-0 z-10 shadow-md border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium text-gray-900 truncate">
                CRM - Gestión de Leads
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Tablero Kanban para gestionar tus leads de ventas
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button 
                onClick={() => setIsNewLeadDialogOpen(true)} 
                size="default"
                className="w-full sm:w-auto shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-md px-4 py-2 font-medium"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nuevo Lead</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
              <Button 
                onClick={fetchLeads} 
                variant="outline" 
                size="default"
                className="w-full sm:w-auto shrink-0 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md px-4 py-2 font-medium"
              >
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            </div>
          </div>

          {/* Estadísticas Material Design - Mejoradas */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden">
              <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-3 px-3 pt-4 sm:pt-5">
                <div className="bg-blue-100 rounded-full p-2.5 sm:p-3 mb-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <CardTitle className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase tracking-wide text-center">
                  Total Leads
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-4 sm:pb-5 flex items-center justify-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden">
              <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-3 px-3 pt-4 sm:pt-5">
                <div className="bg-green-100 rounded-full p-2.5 sm:p-3 mb-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <CardTitle className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase tracking-wide text-center">
                  Ganados
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-4 sm:pb-5 flex items-center justify-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.ganados}</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden">
              <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-3 px-3 pt-4 sm:pt-5">
                <div className="bg-purple-100 rounded-full p-2.5 sm:p-3 mb-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <CardTitle className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase tracking-wide text-center">
                  Tasa Conversión
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-4 sm:pb-5 flex items-center justify-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">{conversionRate}%</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tablero Kanban */}
      <div className="w-full px-4 sm:px-6 py-6 sm:py-8">
        <KanbanBoard leads={leads} onUpdateLead={handleUpdateLead} />
      </div>

      {/* Dialog para nuevo lead */}
      <NewLeadDialog
        open={isNewLeadDialogOpen}
        onOpenChange={setIsNewLeadDialogOpen}
        onLeadCreated={fetchLeads}
      />
    </div>
  )
}

