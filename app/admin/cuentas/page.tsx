"use client"

import { useState, useEffect, useCallback } from 'react'
import { Account } from '@/lib/types/account'
import { CRMSidebar } from '@/components/crm-sidebar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Building2, RefreshCw, AlertTriangle, Inbox, Mail, Phone, Globe, Users,
  ExternalLink,
} from 'lucide-react'

export default function CuentasPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts || [])
      } else {
        setError('No se pudieron cargar las cuentas')
        toast.error('Error al cargar cuentas')
      }
    } catch {
      setError('Error de conexión')
      toast.error('Error al cargar cuentas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  return (
    <div className="min-h-screen crm-surface flex">
      <CRMSidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-[72px] md:pb-0 overflow-x-hidden">
        {/* Header */}
        <div className="crm-header sticky top-0 z-10 shrink-0">
          <div className="px-3 sm:px-6 py-2.5 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="min-w-0">
                <h1 className="crm-title text-[16px] sm:text-[18px] flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[var(--crm-text-muted)]" />
                  Cuentas
                </h1>
                <p className="crm-meta crm-mono mt-0.5 text-[10px] sm:text-[11px]">
                  {loading ? (
                    <span className="crm-skeleton inline-block w-16 h-3" />
                  ) : (
                    `${accounts.length} cuentas`
                  )}
                </p>
              </div>
              <Button
                onClick={fetchAccounts}
                variant="ghost"
                size="sm"
                disabled={loading}
                className={cn(
                  'h-8 w-8 p-0 rounded-md text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)]',
                  loading && 'animate-spin'
                )}
                title="Actualizar"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4">
          {/* Error */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--crm-danger-light)]">
                <AlertTriangle className="h-6 w-6 text-[var(--crm-danger)]" />
              </div>
              <p className="crm-subtitle font-semibold text-[var(--crm-text)]">Error al cargar datos</p>
              <p className="crm-body mt-1">{error}</p>
              <Button onClick={fetchAccounts} className="crm-btn-secondary gap-2 mt-2">
                <RefreshCw className="h-3.5 w-3.5" /> Reintentar
              </Button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-[var(--crm-border-light)] bg-[var(--crm-bg-card)] p-4 space-y-2">
                  <div className="crm-skeleton h-4 w-40" />
                  <div className="crm-skeleton h-3 w-28" />
                  <div className="flex gap-3">
                    <div className="crm-skeleton h-3 w-32" />
                    <div className="crm-skeleton h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && accounts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--crm-bg-subtle)]">
                <Building2 className="h-6 w-6 text-[var(--crm-text-muted)]" />
              </div>
              <div className="text-center max-w-sm">
                <p className="crm-subtitle font-semibold text-[var(--crm-text)]">Sin cuentas aún</p>
                <p className="crm-body mt-1">Las cuentas se crean al convertir un lead ganado.</p>
              </div>
            </div>
          )}

          {/* Account list */}
          {!loading && !error && accounts.length > 0 && (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <div className="rounded-lg border border-[var(--crm-border)] bg-[var(--crm-bg-card)] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--crm-border-light)] bg-[var(--crm-bg-subtle)]">
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--crm-text-muted)]">Empresa</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--crm-text-muted)]">Contacto</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--crm-text-muted)]">Email</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--crm-text-muted)]">Teléfono</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--crm-text-muted)]">Industria</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--crm-text-muted)]">Owner</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--crm-text-muted)]">Creada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((acc) => (
                        <tr key={acc.id} className="border-b border-[var(--crm-border-light)] last:border-b-0 hover:bg-[var(--crm-bg-hover)] transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-[13px] font-semibold text-[var(--crm-text)]">{acc.empresa}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-[13px] text-[var(--crm-text)]">{acc.nombre}</p>
                          </td>
                          <td className="px-4 py-3">
                            {acc.email && (
                              <a href={`mailto:${acc.email}`} className="text-[12px] text-[var(--crm-primary)] hover:underline flex items-center gap-1">
                                <Mail className="h-3 w-3" />{acc.email}
                              </a>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {acc.telefono && (
                              <span className="text-[12px] text-[var(--crm-text-secondary)] flex items-center gap-1">
                                <Phone className="h-3 w-3" />{acc.telefono}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[12px] text-[var(--crm-text-muted)]">{acc.industria || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[12px] text-[var(--crm-text-muted)]">{acc.ownerName || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] crm-mono text-[var(--crm-text-muted)]">
                              {new Date(acc.createdAt).toLocaleDateString('es-AR')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {accounts.map((acc) => (
                  <div key={acc.id} className="bg-[var(--crm-bg-card)] border border-[var(--crm-border-light)] rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--crm-text)] truncate">{acc.empresa}</p>
                        <p className="text-[12px] text-[var(--crm-text-secondary)]">{acc.nombre}</p>
                      </div>
                      {acc.industria && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--crm-bg-subtle)] text-[var(--crm-text-muted)] border border-[var(--crm-border-light)]">
                          {acc.industria}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--crm-text-muted)]">
                      {acc.email && (
                        <a href={`mailto:${acc.email}`} className="flex items-center gap-1 text-[var(--crm-primary)]">
                          <Mail className="h-3 w-3" />{acc.email}
                        </a>
                      )}
                      {acc.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />{acc.telefono}
                        </span>
                      )}
                      {acc.website && (
                        <a href={acc.website} target="_blank" rel="noopener" className="flex items-center gap-1 text-[var(--crm-primary)]">
                          <Globe className="h-3 w-3" />Web
                        </a>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--crm-text-muted)]">
                      {acc.ownerName && (
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{acc.ownerName}</span>
                      )}
                      <span className="crm-mono">{new Date(acc.createdAt).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
