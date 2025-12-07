"use client"

import { CRMSidebar } from '@/components/crm-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default function EstadisticasPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <CRMSidebar />
      
      <div className="flex-1 md:ml-64">
        <div className="bg-white sticky top-0 z-10 shadow-md border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium text-gray-900">
              Estadísticas
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Análisis y métricas de tus leads
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta sección estará disponible próximamente.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

