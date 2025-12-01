"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Database, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function DatabaseAdminPage() {
  const [status, setStatus] = useState<any>(null)
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
    } catch (error: any) {
      toast.error('Error al verificar la base de datos')
      setStatus({ connected: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const initDatabase = async () => {
    setInitializing(true)
    try {
      const response = await fetch('/api/db/init')
      const data = await response.json()
      
      if (data.success) {
        toast.success('Base de datos inicializada correctamente')
        // Verificar de nuevo después de inicializar
        setTimeout(() => checkDatabase(), 1000)
      } else {
        toast.error(data.error || 'Error al inicializar la base de datos')
      }
    } catch (error: any) {
      toast.error('Error al inicializar la base de datos')
    } finally {
      setInitializing(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 md:p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Administración de Base de Datos</h1>
          <p className="text-muted-foreground">
            Verifica el estado y inicializa la base de datos PostgreSQL
          </p>
        </div>

        <div className="space-y-4">
          {/* Card de verificación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Estado de la Base de Datos
              </CardTitle>
              <CardDescription>
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
                <div className="mt-4 space-y-2 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    {status.connected ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-semibold">
                      Conexión: {status.connected ? '✅ Conectada' : '❌ Desconectada'}
                    </span>
                  </div>

                  {status.connected && (
                    <>
                      <div className="flex items-center gap-2">
                        {status.tableExists ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-yellow-600" />
                        )}
                        <span className="font-semibold">
                          Tabla 'leads': {status.tableExists ? '✅ Existe' : '❌ No existe'}
                        </span>
                      </div>

                      {status.tableExists && (
                        <div className="flex items-center gap-2">
                          <Database className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold">
                            Leads en la base de datos: {status.leadCount}
                          </span>
                        </div>
                      )}

                      {status.timestamp && (
                        <div className="text-sm text-muted-foreground">
                          Última verificación: {new Date(status.timestamp).toLocaleString('es-AR')}
                        </div>
                      )}
                    </>
                  )}

                  {status.error && (
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                        Error: {status.error}
                      </p>
                      {status.details && (
                        <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto">
                          {status.details}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de inicialización */}
          <Card>
            <CardHeader>
              <CardTitle>Inicializar Base de Datos</CardTitle>
              <CardDescription>
                Crea la tabla 'leads' si no existe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={initDatabase}
                disabled={initializing || (status?.tableExists)}
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
                <p className="mt-2 text-sm text-muted-foreground">
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

