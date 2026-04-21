"use client"

import { useState, useEffect, useCallback } from 'react'
import { Lead } from '@/lib/types/lead'
import { Account, DuplicateMatch } from '@/lib/types/account'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  Search, Building2, UserPlus, Check, Loader2, ArrowRight, Link2,
  AlertTriangle, DollarSign, Handshake,
} from 'lucide-react'
import { toast } from 'sonner'

type Step = 'account' | 'contact' | 'deal' | 'confirm'
const STEPS: Step[] = ['account', 'contact', 'deal', 'confirm']
const STEP_LABELS = ['Cuenta', 'Contacto', 'Deal', 'Confirmar']

interface ConvertLeadModalProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConverted: (accountId: string) => void
}

export function ConvertLeadModal({ lead, open, onOpenChange, onConverted }: ConvertLeadModalProps) {
  const [step, setStep] = useState<Step>('account')
  const [accountMode, setAccountMode] = useState<'new' | 'existing'>('new')
  const [converting, setConverting] = useState(false)

  // Duplicate detection
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [duplicatesChecked, setDuplicatesChecked] = useState(false)

  // Account search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Account[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  // New account form
  const [accountForm, setAccountForm] = useState({
    nombre: '', empresa: '', cuit: '', email: '', telefono: '', website: '', industria: '',
  })

  // Contact form
  const [contactForm, setContactForm] = useState({
    nombre: '', email: '', telefono: '', cargo: '',
  })

  // Deal form
  const [dealForm, setDealForm] = useState({
    titulo: '', monto: '', moneda: 'ARS', notas: '',
  })

  // Pre-fill from lead + check duplicates
  useEffect(() => {
    if (lead && open) {
      setAccountForm({
        nombre: lead.nombre, empresa: lead.empresa, cuit: '',
        email: lead.email, telefono: lead.telefono, website: '', industria: '',
      })
      setContactForm({ nombre: lead.nombre, email: lead.email, telefono: lead.telefono, cargo: '' })
      setDealForm({
        titulo: `${lead.empresa} - Conversión`,
        monto: lead.inversionEstimada?.replace(/[^0-9.]/g, '') || '',
        moneda: 'ARS', notas: '',
      })
      setStep('account')
      setAccountMode('new')
      setSelectedAccount(null)
      setSearchQuery('')
      setSearchResults([])
      setDuplicates([])
      setDuplicatesChecked(false)

      // Auto-detect duplicates
      checkDuplicates(lead)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead, open])

  const checkDuplicates = async (l: Lead) => {
    try {
      const res = await fetch('/api/accounts/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: l.email, telefono: l.telefono, empresa: l.empresa, nombre: l.nombre,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setDuplicates(data.duplicates || [])
        if ((data.duplicates || []).length > 0) {
          setAccountMode('existing')
        }
      }
    } catch { /* ignore */ } finally {
      setDuplicatesChecked(true)
    }
  }

  // Search accounts
  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/accounts?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.accounts || [])
      }
    } catch { /* ignore */ } finally {
      setSearching(false)
    }
  }, [])

  const handleConvert = async () => {
    if (!lead) return
    setConverting(true)
    try {
      const body: Record<string, string | undefined> = {
        contactNombre: contactForm.nombre,
        contactEmail: contactForm.email,
        contactTelefono: contactForm.telefono,
        contactCargo: contactForm.cargo || undefined,
        dealTitulo: dealForm.titulo,
        dealAmount: dealForm.monto || '0',
        dealMoneda: dealForm.moneda,
        dealNotas: dealForm.notas || undefined,
      }

      if (accountMode === 'existing' && selectedAccount) {
        body.existingAccountId = selectedAccount.id
      } else {
        body.accountNombre = accountForm.nombre
        body.accountEmpresa = accountForm.empresa
        body.accountCuit = accountForm.cuit || undefined
        body.accountEmail = accountForm.email
        body.accountTelefono = accountForm.telefono
        body.accountWebsite = accountForm.website || undefined
        body.accountIndustria = accountForm.industria || undefined
      }

      const res = await fetch(`/api/leads/${lead.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Lead convertido exitosamente')
        onOpenChange(false)
        onConverted(data.accountId)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al convertir')
      }
    } catch {
      toast.error('Error al convertir el lead')
    } finally {
      setConverting(false)
    }
  }

  if (!lead) return null

  const canProceedAccount = accountMode === 'existing'
    ? !!selectedAccount
    : accountForm.nombre.trim() && accountForm.empresa.trim()
  const canProceedContact = contactForm.nombre.trim()

  const stepIndex = STEPS.indexOf(step)
  const nextStep = () => setStep(STEPS[stepIndex + 1])
  const prevStep = () => setStep(STEPS[stepIndex - 1])

  const matchLabel = (t: string) => {
    switch (t) {
      case 'cuit': return 'CUIT'
      case 'email': return 'Email'
      case 'telefono': return 'Teléfono'
      case 'nombre': return 'Nombre'
      default: return t
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <ArrowRight className="h-4 w-4 text-emerald-600" />
            Convertir Lead a Cuenta
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            <span className="font-medium text-[var(--crm-text)]">{lead.nombre}</span> de{' '}
            <span className="font-medium text-[var(--crm-text)]">{lead.empresa}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-1.5 mb-2">
          {STEPS.map((s, i) => {
            const isActive = step === s
            const isDone = stepIndex > i
            return (
              <div key={s} className="flex items-center gap-1.5 flex-1">
                <div className={cn(
                  'flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold shrink-0 transition-colors',
                  isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-[var(--crm-text)] text-white' : 'bg-[var(--crm-bg-subtle)] text-[var(--crm-text-muted)]'
                )}>
                  {isDone ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span className={cn(
                  'text-[10px] font-medium truncate hidden sm:inline',
                  isActive ? 'text-[var(--crm-text)]' : 'text-[var(--crm-text-muted)]'
                )}>{STEP_LABELS[i]}</span>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-[var(--crm-border)] hidden sm:block" />}
              </div>
            )
          })}
        </div>

        {/* ─── Step 1: Account ─── */}
        {step === 'account' && (
          <div className="space-y-3">
            {/* Duplicate suggestions */}
            {duplicatesChecked && duplicates.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                <p className="text-[12px] font-semibold text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Posibles cuentas duplicadas detectadas
                </p>
                <div className="space-y-1.5">
                  {duplicates.map((d) => (
                    <button
                      key={d.account.id}
                      onClick={() => {
                        setSelectedAccount(d.account)
                        setAccountMode('existing')
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md border transition-colors text-[12px]',
                        selectedAccount?.id === d.account.id
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-white border-amber-200 hover:bg-amber-50/50'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-medium text-[var(--crm-text)]">{d.account.empresa}</span>
                          <span className="text-[var(--crm-text-muted)]"> · {d.account.nombre}</span>
                        </div>
                        <span className={cn(
                          'shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
                          d.confidence === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        )}>
                          {matchLabel(d.matchType)}
                        </span>
                      </div>
                      {d.account.email && (
                        <p className="text-[11px] text-[var(--crm-text-muted)] mt-0.5">{d.account.email}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Tabs value={accountMode} onValueChange={(v) => setAccountMode(v as 'new' | 'existing')}>
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="new" className="text-[12px] gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Nueva cuenta
                </TabsTrigger>
                <TabsTrigger value="existing" className="text-[12px] gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  Existente {duplicates.length > 0 && `(${duplicates.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="space-y-3 mt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px]">Nombre *</Label>
                    <Input value={accountForm.nombre} onChange={(e) => setAccountForm((f) => ({ ...f, nombre: e.target.value }))} className="h-8 text-[13px] mt-1" placeholder="Nombre de la cuenta" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Empresa *</Label>
                    <Input value={accountForm.empresa} onChange={(e) => setAccountForm((f) => ({ ...f, empresa: e.target.value }))} className="h-8 text-[13px] mt-1" placeholder="Empresa" />
                  </div>
                  <div>
                    <Label className="text-[11px]">CUIT</Label>
                    <Input value={accountForm.cuit} onChange={(e) => setAccountForm((f) => ({ ...f, cuit: e.target.value }))} className="h-8 text-[13px] mt-1" placeholder="20-12345678-9" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Email</Label>
                    <Input type="email" value={accountForm.email} onChange={(e) => setAccountForm((f) => ({ ...f, email: e.target.value }))} className="h-8 text-[13px] mt-1" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Teléfono</Label>
                    <Input value={accountForm.telefono} onChange={(e) => setAccountForm((f) => ({ ...f, telefono: e.target.value }))} className="h-8 text-[13px] mt-1" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Website</Label>
                    <Input value={accountForm.website} onChange={(e) => setAccountForm((f) => ({ ...f, website: e.target.value }))} className="h-8 text-[13px] mt-1" placeholder="https://..." />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-[11px]">Industria</Label>
                    <Input value={accountForm.industria} onChange={(e) => setAccountForm((f) => ({ ...f, industria: e.target.value }))} className="h-8 text-[13px] mt-1" placeholder="Ej: Alimenticia" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="existing" className="space-y-3 mt-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--crm-text-muted)]" />
                  <Input value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="h-8 text-[13px] pl-8" placeholder="Buscar por empresa, nombre, email o CUIT..." />
                  {searching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-[var(--crm-text-muted)]" />}
                </div>

                {searchResults.length > 0 && (
                  <div className="border border-[var(--crm-border)] rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((acc) => (
                      <button key={acc.id} onClick={() => setSelectedAccount(acc)} className={cn(
                        'w-full text-left px-3 py-2.5 border-b last:border-b-0 border-[var(--crm-border-light)] transition-colors',
                        selectedAccount?.id === acc.id ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : 'hover:bg-[var(--crm-bg-hover)]'
                      )}>
                        <p className="text-[13px] font-medium text-[var(--crm-text)]">{acc.empresa}</p>
                        <p className="text-[11px] text-[var(--crm-text-muted)]">{acc.nombre}{acc.cuit ? ` · CUIT: ${acc.cuit}` : ''}{acc.email ? ` · ${acc.email}` : ''}</p>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                  <p className="text-[12px] text-[var(--crm-text-muted)] text-center py-4">No se encontraron cuentas.</p>
                )}

                {selectedAccount && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-[12px] font-medium text-emerald-700">Cuenta seleccionada:</p>
                    <p className="text-[13px] font-semibold text-[var(--crm-text)]">{selectedAccount.empresa}</p>
                    <p className="text-[11px] text-[var(--crm-text-muted)]">{selectedAccount.nombre}{selectedAccount.cuit ? ` · CUIT: ${selectedAccount.cuit}` : ''}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* ─── Step 2: Contact ─── */}
        {step === 'contact' && (
          <div className="space-y-3">
            <p className="text-[12px] text-[var(--crm-text-muted)] flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              Crear contacto vinculado a la cuenta
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">Nombre *</Label>
                <Input value={contactForm.nombre} onChange={(e) => setContactForm((f) => ({ ...f, nombre: e.target.value }))} className="h-8 text-[13px] mt-1" />
              </div>
              <div>
                <Label className="text-[11px]">Cargo</Label>
                <Input value={contactForm.cargo} onChange={(e) => setContactForm((f) => ({ ...f, cargo: e.target.value }))} className="h-8 text-[13px] mt-1" placeholder="Ej: Gerente comercial" />
              </div>
              <div>
                <Label className="text-[11px]">Email</Label>
                <Input type="email" value={contactForm.email} onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} className="h-8 text-[13px] mt-1" />
              </div>
              <div>
                <Label className="text-[11px]">Teléfono</Label>
                <Input value={contactForm.telefono} onChange={(e) => setContactForm((f) => ({ ...f, telefono: e.target.value }))} className="h-8 text-[13px] mt-1" />
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 3: Deal ─── */}
        {step === 'deal' && (
          <div className="space-y-3">
            <p className="text-[12px] text-[var(--crm-text-muted)] flex items-center gap-1.5">
              <Handshake className="h-3.5 w-3.5" />
              Registrar deal ganado
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-[11px]">Título del Deal</Label>
                <Input value={dealForm.titulo} onChange={(e) => setDealForm((f) => ({ ...f, titulo: e.target.value }))} className="h-8 text-[13px] mt-1" />
              </div>
              <div>
                <Label className="text-[11px]">Monto</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--crm-text-muted)]" />
                  <Input type="number" value={dealForm.monto} onChange={(e) => setDealForm((f) => ({ ...f, monto: e.target.value }))} className="h-8 text-[13px] pl-8" placeholder="0.00" />
                </div>
              </div>
              <div>
                <Label className="text-[11px]">Moneda</Label>
                <Input value={dealForm.moneda} onChange={(e) => setDealForm((f) => ({ ...f, moneda: e.target.value }))} className="h-8 text-[13px] mt-1" placeholder="ARS" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-[11px]">Notas</Label>
                <Input value={dealForm.notas} onChange={(e) => setDealForm((f) => ({ ...f, notas: e.target.value }))} className="h-8 text-[13px] mt-1" placeholder="Notas del deal..." />
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 4: Confirm ─── */}
        {step === 'confirm' && (
          <div className="space-y-3">
            <div className="bg-[var(--crm-bg-subtle)] rounded-lg p-3 space-y-2">
              <p className="text-[11px] font-semibold text-[var(--crm-text)] uppercase tracking-wide">Resumen de conversión</p>
              <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1.5 text-[12px]">
                <span className="text-[var(--crm-text-muted)]">Lead:</span>
                <span className="text-[var(--crm-text)] font-medium">{lead.nombre} ({lead.empresa})</span>

                <span className="text-[var(--crm-text-muted)]">Cuenta:</span>
                <span className="text-[var(--crm-text)] font-medium">
                  {accountMode === 'existing' && selectedAccount
                    ? `${selectedAccount.empresa} (existente)`
                    : `${accountForm.empresa} (nueva)${accountForm.cuit ? ` · CUIT: ${accountForm.cuit}` : ''}`}
                </span>

                <span className="text-[var(--crm-text-muted)]">Contacto:</span>
                <span className="text-[var(--crm-text)] font-medium">
                  {contactForm.nombre}{contactForm.cargo ? ` · ${contactForm.cargo}` : ''}
                </span>

                <span className="text-[var(--crm-text-muted)]">Deal:</span>
                <span className="text-[var(--crm-text)] font-medium">
                  {dealForm.titulo} · {dealForm.moneda} {Number(dealForm.monto || 0).toLocaleString('es-AR')}
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">WON</span>
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-[12px] text-blue-800">
                Al confirmar, se creará la Cuenta, el Contacto y el Deal. El lead será marcado como <strong>convertido</strong> y serás redirigido a la vista 360 de la cuenta.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          {stepIndex > 0 && (
            <Button variant="outline" size="sm" onClick={prevStep} className="text-[12px] w-full sm:w-auto">
              Anterior
            </Button>
          )}
          {stepIndex === 0 && (
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[12px] w-full sm:w-auto">
              Cancelar
            </Button>
          )}

          {step !== 'confirm' ? (
            <Button
              size="sm"
              onClick={nextStep}
              disabled={step === 'account' ? !canProceedAccount : step === 'contact' ? !canProceedContact : false}
              className="crm-btn-primary text-[12px] gap-1.5 w-full sm:w-auto"
            >
              Siguiente <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleConvert} disabled={converting} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] gap-1.5 w-full sm:w-auto">
              {converting ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Convirtiendo...</>
              ) : (
                <><Check className="h-3.5 w-3.5" /> Confirmar conversión</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
