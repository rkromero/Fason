import { CRMSidebar } from '@/components/crm-sidebar'
import { Settings } from 'lucide-react'

export default function ConfiguracionPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <CRMSidebar />
      <div className="flex-1 md:ml-64">
        <div className="bg-white sticky top-0 z-10 shadow-md border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-600 mt-1">Ajustes del sistema CRM</p>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-400">
          <Settings className="h-16 w-16" />
          <p className="text-lg font-medium">Configuración en construcción</p>
          <p className="text-sm">Esta sección estará disponible próximamente.</p>
        </div>
      </div>
    </div>
  )
}
