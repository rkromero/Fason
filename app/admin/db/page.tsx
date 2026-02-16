"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Database, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { CRMSidebar } from '@/components/crm-sidebar'

export default function DatabaseAdminPage() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)

  const checkDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/db/check')
      const data = await response.json()
      setStatus(data)

      if (data.connected) {
        if (data.tableExists) {
          toast.success(`Base de datos conectada. Tabla existe con ${data.leadCount} leads`)
        } else {
          toast.warning('Base de datos conectada pero la tabla no existe')
        }
      } else {
        toast.error('Error al conectar con la base de datos')
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      toast.error('Error al verificar la base de datos')
      setStatus({ connected: false, error: msg })
    } finally {
      setLoading(false)
    }
  }

  const initDatabase = async () => {
    setInitializing(true)
    try {
      const response = await fetch('/api/db/init', { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        toast.success('Base de datos inicializada correctamente')
        setTimeout(() => checkDatabase(), 1000)
      } else {
        toast.error(data.error || 'Error al inicializar la base de datos')
      }
    } catch {
      toast.error('Error al inicializar la base de datos')
    } finally {
      setInitializing(false)
    }
  }

  return (
    <div className="min-h-screen crm-surface flex">
      <CRMSidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-[72px] md:pb-0">
        {/* Header */}
        <div className="crm-header sticky top-0 z-10 shrink-0">
          <div className="px-3 sm:px-6 py-2.5 sm:py-4">
            <h1 className="crm-title text-[16px] sm:text-[18px]">Base de Datos</h1>
            <p className="crm-meta crm-mono mt-0.5 text-[10px] sm:text-[11px]">
              Verificá el estado y administrá la base de datos
            </p>
          </div>
        </div>

        <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4 space-y-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px] sm:text-base">
                <Database className="h-5 w-5" />
                Estado de la Base de Datos
              </CardTitle>
              <CardDescription className="text-[12px] sm:text-sm">
                Verifica la conexión y el estado de las tablas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={checkDatabase}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Verificar Estado
                  </>
                )}
              </Button>

              {status && (
                <div className="mt-4 space-y-2 p-3 sm:p-4 bg-muted rounded-lg text-[13px] sm:text-sm">
                  <div className="flex items-center gap-2">
                    {status.connected ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                    )}
                    <span className="font-semibold">
                      Conexión: {status.connected ? 'Conectada' : 'Desconectada'}
                    </span>
                  </div>

                  {status.connected && (
                    <>
                      <div className="flex items-center gap-2">
                        {status.tableExists ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                        )}
                        <span className="font-semibold">
                          Tabla leads: {status.tableExists ? 'Existe' : 'No existe'}
                        </span>
                      </div>

                      {status.tableExists && (
                        <div className="flex items-center gap-2">
                          <Database className="h-5 w-5 text-blue-600 shrink-0" />
                          <span className="font-semibold">
                            Leads: {String(status.leadCount)}
                          </span>
                        </div>
                      )}

                      {status.timestamp && (
                        <div className="text-xs text-muted-foreground">
                          Última verificación: {new Date(String(status.timestamp)).toLocaleString('es-AR')}
                        </div>
                      )}
                    </>
                  )}

                  {status.error && (
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                      <p className="text-xs sm:text-sm text-red-800 dark:text-red-200 font-medium break-all">
                        Error: {String(status.error)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[15px] sm:text-base">Inicializar Base de Datos</CardTitle>
              <CardDescription className="text-[12px] sm:text-sm">
                Crea la tabla leads si no existe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={initDatabase}
                disabled={initializing || Boolean(status?.tableExists)}
                variant={status?.tableExists ? "outline" : "default"}
                className="w-full sm:w-auto"
              >
                {initializing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Inicializando...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Inicializar Base de Datos
                  </>
                )}
              </Button>
              {status?.tableExists && (
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                  La tabla ya existe. No es necesario inicializar.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
