"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Account, Contact, Deal, DEAL_STATUSES } from '@/lib/types/account'
import { CRMSidebar } from '@/components/crm-sidebar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Building2, ArrowLeft, RefreshCw, Mail, Phone, Globe, Users,
  AlertTriangle, UserCircle, Handshake, History, DollarSign,
  MapPin, FileText, Calendar, ExternalLink, Tag,
} from 'lucide-react'

interface ConvertedLead {
  id: string
  nombre: string
  empresa: string
  email: string
  telefono: string
  producto: string
  volumen: string
  inversionEstimada?: string
  createdAt: string
  convertedAt?: string
}

export default function AccountDetailPage() {
  const params = useParams()
  const router = useRouter()
  const accountId = params.id as string

  const [account, setAccount] = useState<Account | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [convertedLeads, setConvertedLeads] = useState<ConvertedLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState('resumen')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/accounts/${accountId}`)
      if (res.ok) {
        const data = await res.json()
        setAccount(data.account)
        setContacts(data.contacts || [])
        setDeals(data.deals || [])
        setConvertedLeads(data.convertedLeads || [])
      } else if (res.status === 404) {
        setError('Cuenta no encontrada')
      } else {
        setError('Error al cargar la cuenta')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [accountId])

  useEffect(() => { fetchData() }, [fetchData])

  const totalDeals = deals.reduce((s, d) => s + d.monto, 0)
  const wonDeals = deals.filter((d) => d.status === 'won')
  const wonTotal = wonDeals.reduce((s, d) => s + d.monto, 0)

  const formatMoney = (n: number, cur = 'ARS') =>
    `${cur} ${n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

  return (
    <div className="min-h-screen crm-surface flex">
      <CRMSidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-[72px] md:pb-0 overflow-x-hidden">
        {/* Header */}
        <div className="crm-header sticky top-0 z-10 shrink-0">
          <div className="px-3 sm:px-6 py-2.5 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/admin/cuentas')} className="h-8 w-8 p-0 rounded-md text-[var(--crm-text-muted)] hover:text-[var(--crm-text)]">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                {loading ? (
                  <>
                    <div className="crm-skeleton h-5 w-48 mb-1" />
                    <div className="crm-skeleton h-3 w-32" />
                  </>
                ) : account ? (
                  <>
                    <h1 className="crm-title text-[16px] sm:text-[18px] truncate">{account.empresa}</h1>
                    <p className="crm-meta text-[11px] truncate">
                      {account.nombre}{account.cuit ? ` · CUIT: ${account.cuit}` : ''}{account.industria ? ` · ${account.industria}` : ''}
                    </p>
                  </>
                ) : (
                  <h1 className="crm-title text-[16px]">Cuenta</h1>
                )}
              </div>
              <Button onClick={fetchData} variant="ghost" size="sm" disabled={loading} className={cn('h-8 w-8 p-0 rounded-md text-[var(--crm-text-muted)]', loading && 'animate-spin')}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Quick stats */}
            {!loading && account && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <div className="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--crm-bg-card)] border border-[var(--crm-border-light)]">
                  <p className="text-[10px] text-[var(--crm-text-muted)] uppercase font-medium">Contactos</p>
                  <p className="text-[15px] font-bold crm-mono text-[var(--crm-text)]">{contacts.length}</p>
                </div>
                <div className="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--crm-bg-card)] border border-[var(--crm-border-light)]">
                  <p className="text-[10px] text-[var(--crm-text-muted)] uppercase font-medium">Deals</p>
                  <p className="text-[15px] font-bold crm-mono text-[var(--crm-text)]">{deals.length}</p>
                </div>
                <div className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-[10px] text-emerald-600 uppercase font-medium">Total Ganado</p>
                  <p className="text-[15px] font-bold crm-mono text-emerald-700">{formatMoney(wonTotal)}</p>
                </div>
                <div className="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--crm-bg-card)] border border-[var(--crm-border-light)]">
                  <p className="text-[10px] text-[var(--crm-text-muted)] uppercase font-medium">Leads Convertidos</p>
                  <p className="text-[15px] font-bold crm-mono text-[var(--crm-text)]">{convertedLeads.length}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4">
          {error && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--crm-danger-light)]">
                <AlertTriangle className="h-6 w-6 text-[var(--crm-danger)]" />
              </div>
              <p className="crm-subtitle font-semibold text-[var(--crm-text)]">{error}</p>
              <Button onClick={() => router.push('/admin/cuentas')} className="crm-btn-secondary gap-2 mt-2">
                <ArrowLeft className="h-3.5 w-3.5" /> Volver a Cuentas
              </Button>
            </div>
          )}

          {!loading && !error && account && (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide h-10 bg-transparent border-b border-[var(--crm-border)] rounded-none p-0 gap-0">
                {[
                  { id: 'resumen', label: 'Resumen', icon: Building2 },
                  { id: 'contactos', label: 'Contactos', icon: UserCircle, count: contacts.length },
                  { id: 'deals', label: 'Deals', icon: Handshake, count: deals.length },
                  { id: 'actividad', label: 'Actividad', icon: History, count: convertedLeads.length },
                ].map((t) => (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className={cn(
                      'rounded-none border-b-2 border-transparent px-3 sm:px-4 py-2 text-[12px] font-medium gap-1.5 transition-colors data-[state=active]:border-b-[var(--crm-text)] data-[state=active]:text-[var(--crm-text)] data-[state=active]:shadow-none',
                      'text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)]'
                    )}
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t.label}</span>
                    <span className="sm:hidden">{t.label.slice(0, 3)}</span>
                    {t.count !== undefined && t.count > 0 && (
                      <span className="text-[9px] crm-mono bg-[var(--crm-bg-subtle)] px-1.5 py-0.5 rounded-full">{t.count}</span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ─── Resumen tab ─── */}
              <TabsContent value="resumen" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Info card */}
                  <div className="bg-[var(--crm-bg-card)] border border-[var(--crm-border-light)] rounded-lg p-4 space-y-3">
                    <h3 className="text-[13px] font-semibold text-[var(--crm-text)] flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[var(--crm-text-muted)]" /> Información
                    </h3>
                    <div className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-2 text-[12px]">
                      <span className="text-[var(--crm-text-muted)]">Empresa</span>
                      <span className="font-medium text-[var(--crm-text)]">{account.empresa}</span>
                      <span className="text-[var(--crm-text-muted)]">Nombre</span>
                      <span className="text-[var(--crm-text)]">{account.nombre}</span>
                      {account.cuit && <>
                        <span className="text-[var(--crm-text-muted)]">CUIT</span>
                        <span className="text-[var(--crm-text)] crm-mono">{account.cuit}</span>
                      </>}
                      {account.industria && <>
                        <span className="text-[var(--crm-text-muted)]">Industria</span>
                        <span className="text-[var(--crm-text)]">{account.industria}</span>
                      </>}
                      {account.email && <>
                        <span className="text-[var(--crm-text-muted)]">Email</span>
                        <a href={`mailto:${account.email}`} className="text-[var(--crm-primary)] hover:underline flex items-center gap-1">
                          <Mail className="h-3 w-3" />{account.email}
                        </a>
                      </>}
                      {account.telefono && <>
                        <span className="text-[var(--crm-text-muted)]">Teléfono</span>
                        <span className="text-[var(--crm-text)] flex items-center gap-1">
                          <Phone className="h-3 w-3 text-[var(--crm-text-muted)]" />{account.telefono}
                        </span>
                      </>}
                      {account.website && <>
                        <span className="text-[var(--crm-text-muted)]">Website</span>
                        <a href={account.website} target="_blank" rel="noopener" className="text-[var(--crm-primary)] hover:underline flex items-center gap-1">
                          <Globe className="h-3 w-3" />{account.website}
                        </a>
                      </>}
                      <span className="text-[var(--crm-text-muted)]">Owner</span>
                      <span className="text-[var(--crm-text)]">{account.ownerName || 'Sin asignar'}</span>
                      <span className="text-[var(--crm-text-muted)]">Creada</span>
                      <span className="text-[var(--crm-text)] crm-mono">{new Date(account.createdAt).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>

                  {/* Deals summary card */}
                  <div className="bg-[var(--crm-bg-card)] border border-[var(--crm-border-light)] rounded-lg p-4 space-y-3">
                    <h3 className="text-[13px] font-semibold text-[var(--crm-text)] flex items-center gap-2">
                      <Handshake className="h-4 w-4 text-[var(--crm-text-muted)]" /> Resumen Deals
                    </h3>
                    {deals.length === 0 ? (
                      <p className="text-[12px] text-[var(--crm-text-muted)]">Sin deals registrados</p>
                    ) : (
                      <div className="space-y-2">
                        {deals.slice(0, 5).map((deal) => {
                          const st = DEAL_STATUSES.find((s) => s.id === deal.status)
                          return (
                            <div key={deal.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--crm-border-light)] last:border-b-0">
                              <div className="min-w-0">
                                <p className="text-[12px] font-medium text-[var(--crm-text)] truncate">{deal.titulo}</p>
                                <p className="text-[11px] text-[var(--crm-text-muted)] crm-mono">{deal.closedAt ? new Date(deal.closedAt).toLocaleDateString('es-AR') : ''}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[12px] font-semibold crm-mono text-[var(--crm-text)]">{formatMoney(deal.monto, deal.moneda)}</span>
                                <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border', st?.color || '')}>
                                  {st?.label || deal.status}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                        {deals.length > 5 && (
                          <button onClick={() => setTab('deals')} className="text-[11px] text-[var(--crm-primary)] hover:underline">
                            Ver todos ({deals.length})
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {account.notas && (
                  <div className="bg-[var(--crm-bg-card)] border border-[var(--crm-border-light)] rounded-lg p-4">
                    <h3 className="text-[13px] font-semibold text-[var(--crm-text)] flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-[var(--crm-text-muted)]" /> Notas
                    </h3>
                    <p className="text-[12px] text-[var(--crm-text-secondary)] whitespace-pre-wrap">{account.notas}</p>
                  </div>
                )}
              </TabsContent>

              {/* ─── Contactos tab ─── */}
              <TabsContent value="contactos" className="mt-4 space-y-3">
                {contacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <UserCircle className="h-8 w-8 text-[var(--crm-text-muted)]" />
                    <p className="text-[13px] text-[var(--crm-text-muted)]">Sin contactos</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {contacts.map((c) => (
                      <div key={c.id} className="bg-[var(--crm-bg-card)] border border-[var(--crm-border-light)] rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--crm-bg-subtle)] text-[var(--crm-text-muted)] text-[13px] font-bold shrink-0">
                            {c.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-[var(--crm-text)]">{c.nombre}</p>
                            {c.cargo && <p className="text-[11px] text-[var(--crm-text-secondary)]">{c.cargo}</p>}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11px]">
                              {c.email && (
                                <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-[var(--crm-primary)] hover:underline">
                                  <Mail className="h-3 w-3" />{c.email}
                                </a>
                              )}
                              {c.telefono && (
                                <span className="flex items-center gap-1 text-[var(--crm-text-muted)]">
                                  <Phone className="h-3 w-3" />{c.telefono}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ─── Deals tab ─── */}
              <TabsContent value="deals" className="mt-4 space-y-3">
                {deals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Handshake className="h-8 w-8 text-[var(--crm-text-muted)]" />
                    <p className="text-[13px] text-[var(--crm-text-muted)]">Sin deals</p>
                  </div>
                ) : (
                  <>
                    {/* Summary bar */}
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                      <div className="shrink-0 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                        <p className="text-[10px] text-emerald-600 font-medium uppercase">Ganados</p>
                        <p className="text-[14px] font-bold crm-mono text-emerald-700">{wonDeals.length} · {formatMoney(wonTotal)}</p>
                      </div>
                      <div className="shrink-0 px-3 py-2 rounded-lg bg-[var(--crm-bg-card)] border border-[var(--crm-border-light)]">
                        <p className="text-[10px] text-[var(--crm-text-muted)] font-medium uppercase">Total Deals</p>
                        <p className="text-[14px] font-bold crm-mono text-[var(--crm-text)]">{deals.length} · {formatMoney(totalDeals)}</p>
                      </div>
                    </div>

                    {/* Deal cards */}
                    <div className="space-y-2">
                      {deals.map((deal) => {
                        const st = DEAL_STATUSES.find((s) => s.id === deal.status)
                        return (
                          <div key={deal.id} className="bg-[var(--crm-bg-card)] border border-[var(--crm-border-light)] rounded-lg p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-[var(--crm-text)] truncate">{deal.titulo}</p>
                                {deal.ownerName && <p className="text-[11px] text-[var(--crm-text-muted)]">Owner: {deal.ownerName}</p>}
                              </div>
                              <span className={cn('shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase border', st?.color || '')}>
                                {st?.label || deal.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--crm-text-muted)]">
                              <span className="flex items-center gap-1 text-[13px] font-semibold crm-mono text-[var(--crm-text)]">
                                <DollarSign className="h-3.5 w-3.5 text-[var(--crm-text-muted)]" />
                                {formatMoney(deal.monto, deal.moneda)}
                              </span>
                              {deal.closedAt && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />Cerrado: {new Date(deal.closedAt).toLocaleDateString('es-AR')}
                                </span>
                              )}
                              {deal.originLeadId && (
                                <span className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />Desde lead
                                </span>
                              )}
                            </div>
                            {deal.notas && <p className="text-[11px] text-[var(--crm-text-secondary)] mt-2">{deal.notas}</p>}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* ─── Actividad tab (converted leads history) ─── */}
              <TabsContent value="actividad" className="mt-4 space-y-3">
                {convertedLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <History className="h-8 w-8 text-[var(--crm-text-muted)]" />
                    <p className="text-[13px] text-[var(--crm-text-muted)]">Sin actividad registrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-[13px] font-semibold text-[var(--crm-text)]">Leads convertidos a esta cuenta</h3>
                    <div className="relative pl-4 border-l-2 border-[var(--crm-border)] space-y-4">
                      {convertedLeads.map((lead) => (
                        <div key={lead.id} className="relative">
                          <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                          <div className="bg-[var(--crm-bg-card)] border border-[var(--crm-border-light)] rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-[13px] font-semibold text-[var(--crm-text)]">{lead.nombre}</p>
                              <span className="text-[10px] crm-mono text-[var(--crm-text-muted)]">
                                {lead.convertedAt ? new Date(lead.convertedAt).toLocaleDateString('es-AR') : ''}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--crm-text-muted)]">
                              <span>{lead.email}</span>
                              <span>{lead.telefono}</span>
                              {lead.producto && <span className="capitalize">{lead.producto}</span>}
                              {lead.inversionEstimada && <span>Inversión: {lead.inversionEstimada}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4 mt-4">
              <div className="flex gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="crm-skeleton h-8 w-24 rounded" />
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-[var(--crm-border-light)] bg-[var(--crm-bg-card)] p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3"><div className="crm-skeleton h-3 w-20" /><div className="crm-skeleton h-3 w-32" /></div>
                  ))}
                </div>
                <div className="rounded-lg border border-[var(--crm-border-light)] bg-[var(--crm-bg-card)] p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="crm-skeleton h-10 w-full rounded" />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
