"use client"

import { useState, useEffect, useCallback } from 'react'
import { Lead } from '@/lib/types/lead'
import { Account } from '@/lib/types/account'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Search, Building2, UserPlus, Check, Loader2, ArrowRight, Link2 } from 'lucide-react'
import { toast } from 'sonner'

interface ConvertLeadModalProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConverted: () => void
}

export function ConvertLeadModal({ lead, open, onOpenChange, onConverted }: ConvertLeadModalProps) {
  const [step, setStep] = useState<'account' | 'contact' | 'confirm'>('account')
  const [accountMode, setAccountMode] = useState<'new' | 'existing'>('new')
  const [converting, setConverting] = useState(false)

  // Account search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Account[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  // New account form
  const [accountForm, setAccountForm] = useState({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    website: '',
    industria: '',
  })

  // Contact form
  const [contactForm, setContactForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    cargo: '',
  })

  // Pre-fill from lead
  useEffect(() => {
    if (lead && open) {
      setAccountForm({
        nombre: lead.nombre,
        empresa: lead.empresa,
        email: lead.email,
        telefono: lead.telefono,
        website: '',
        industria: '',
      })
      setContactForm({
        nombre: lead.nombre,
        email: lead.email,
        telefono: lead.telefono,
        cargo: '',
      })
      setStep('account')
      setAccountMode('new')
      setSelectedAccount(null)
      setSearchQuery('')
      setSearchResults([])
    }
  }, [lead, open])

  // Search accounts
  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/accounts?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.accounts || [])
      }
    } catch {
      // ignore
    } finally {
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
      }

      if (accountMode === 'existing' && selectedAccount) {
        body.existingAccountId = selectedAccount.id
      } else {
        body.accountNombre = accountForm.nombre
        body.accountEmpresa = accountForm.empresa
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
        toast.success('Lead convertido exitosamente')
        onConverted()
        onOpenChange(false)
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
        <div className="flex items-center gap-2 mb-2">
          {(['account', 'contact', 'confirm'] as const).map((s, i) => {
            const labels = ['Cuenta', 'Contacto', 'Confirmar']
            const isActive = step === s
            const isDone = (['account', 'contact', 'confirm'] as const).indexOf(step) > i
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-bold shrink-0 transition-colors',
                  isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-[var(--crm-text)] text-white' : 'bg-[var(--crm-bg-subtle)] text-[var(--crm-text-muted)]'
                )}>
                  {isDone ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span className={cn(
                  'text-[11px] font-medium truncate',
                  isActive ? 'text-[var(--crm-text)]' : 'text-[var(--crm-text-muted)]'
                )}>{labels[i]}</span>
                {i < 2 && <div className="flex-1 h-px bg-[var(--crm-border)] hidden sm:block" />}
              </div>
            )
          })}
        </div>

        {/* Step 1: Account */}
        {step === 'account' && (
          <div className="space-y-3">
            <Tabs value={accountMode} onValueChange={(v) => setAccountMode(v as 'new' | 'existing')}>
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="new" className="text-[12px] gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Nueva cuenta
                </TabsTrigger>
                <TabsTrigger value="existing" className="text-[12px] gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  Cuenta existente
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="space-y-3 mt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px]">Nombre *</Label>
                    <Input
                      value={accountForm.nombre}
                      onChange={(e) => setAccountForm((f) => ({ ...f, nombre: e.target.value }))}
                      className="h-8 text-[13px] mt-1"
                      placeholder="Nombre de la cuenta"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Empresa *</Label>
                    <Input
                      value={accountForm.empresa}
                      onChange={(e) => setAccountForm((f) => ({ ...f, empresa: e.target.value }))}
                      className="h-8 text-[13px] mt-1"
                      placeholder="Empresa"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Email</Label>
                    <Input
                      type="email"
                      value={accountForm.email}
                      onChange={(e) => setAccountForm((f) => ({ ...f, email: e.target.value }))}
                      className="h-8 text-[13px] mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Teléfono</Label>
                    <Input
                      value={accountForm.telefono}
                      onChange={(e) => setAccountForm((f) => ({ ...f, telefono: e.target.value }))}
                      className="h-8 text-[13px] mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Website</Label>
                    <Input
                      value={accountForm.website}
                      onChange={(e) => setAccountForm((f) => ({ ...f, website: e.target.value }))}
                      className="h-8 text-[13px] mt-1"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Industria</Label>
                    <Input
                      value={accountForm.industria}
                      onChange={(e) => setAccountForm((f) => ({ ...f, industria: e.target.value }))}
                      className="h-8 text-[13px] mt-1"
                      placeholder="Ej: Alimenticia"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="existing" className="space-y-3 mt-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--crm-text-muted)]" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="h-8 text-[13px] pl-8"
                    placeholder="Buscar por empresa, nombre o email..."
                  />
                  {searching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-[var(--crm-text-muted)]" />}
                </div>

                {searchResults.length > 0 && (
                  <div className="border border-[var(--crm-border)] rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => setSelectedAccount(acc)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 border-b last:border-b-0 border-[var(--crm-border-light)] transition-colors',
                          selectedAccount?.id === acc.id
                            ? 'bg-emerald-50 border-l-2 border-l-emerald-500'
                            : 'hover:bg-[var(--crm-bg-hover)]'
                        )}
                      >
                        <p className="text-[13px] font-medium text-[var(--crm-text)]">{acc.empresa}</p>
                        <p className="text-[11px] text-[var(--crm-text-muted)]">{acc.nombre} · {acc.email}</p>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                  <p className="text-[12px] text-[var(--crm-text-muted)] text-center py-4">
                    No se encontraron cuentas. Probá con &quot;Nueva cuenta&quot;.
                  </p>
                )}

                {selectedAccount && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-[12px] font-medium text-emerald-700">Cuenta seleccionada:</p>
                    <p className="text-[13px] font-semibold text-[var(--crm-text)]">{selectedAccount.empresa}</p>
                    <p className="text-[11px] text-[var(--crm-text-muted)]">{selectedAccount.nombre}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Step 2: Contact */}
        {step === 'contact' && (
          <div className="space-y-3">
            <p className="text-[12px] text-[var(--crm-text-muted)] flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              Crear contacto vinculado a la cuenta
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">Nombre *</Label>
                <Input
                  value={contactForm.nombre}
                  onChange={(e) => setContactForm((f) => ({ ...f, nombre: e.target.value }))}
                  className="h-8 text-[13px] mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px]">Cargo</Label>
                <Input
                  value={contactForm.cargo}
                  onChange={(e) => setContactForm((f) => ({ ...f, cargo: e.target.value }))}
                  className="h-8 text-[13px] mt-1"
                  placeholder="Ej: Gerente comercial"
                />
              </div>
              <div>
                <Label className="text-[11px]">Email</Label>
                <Input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                  className="h-8 text-[13px] mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px]">Teléfono</Label>
                <Input
                  value={contactForm.telefono}
                  onChange={(e) => setContactForm((f) => ({ ...f, telefono: e.target.value }))}
                  className="h-8 text-[13px] mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-3">
            <div className="bg-[var(--crm-bg-subtle)] rounded-lg p-3 space-y-2">
              <p className="text-[12px] font-semibold text-[var(--crm-text)] uppercase tracking-wide">Resumen de conversión</p>

              <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1.5 text-[12px]">
                <span className="text-[var(--crm-text-muted)]">Lead:</span>
                <span className="text-[var(--crm-text)] font-medium">{lead.nombre} ({lead.empresa})</span>

                <span className="text-[var(--crm-text-muted)]">Cuenta:</span>
                <span className="text-[var(--crm-text)] font-medium">
                  {accountMode === 'existing' && selectedAccount
                    ? `${selectedAccount.empresa} (existente)`
                    : `${accountForm.empresa} (nueva)`}
                </span>

                <span className="text-[var(--crm-text-muted)]">Contacto:</span>
                <span className="text-[var(--crm-text)] font-medium">
                  {contactForm.nombre}{contactForm.cargo ? ` · ${contactForm.cargo}` : ''}
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-[12px] text-amber-800">
                Al convertir, el lead será marcado como <strong>convertido</strong> y ya no aparecerá en el Kanban. Las notas y actividades quedarán vinculadas a la cuenta.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          {step !== 'account' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(step === 'confirm' ? 'contact' : 'account')}
              className="text-[12px] w-full sm:w-auto"
            >
              Anterior
            </Button>
          )}
          {step === 'account' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-[12px] w-full sm:w-auto"
            >
              Cancelar
            </Button>
          )}

          {step !== 'confirm' ? (
            <Button
              size="sm"
              onClick={() => setStep(step === 'account' ? 'contact' : 'confirm')}
              disabled={step === 'account' ? !canProceedAccount : !canProceedContact}
              className="crm-btn-primary text-[12px] gap-1.5 w-full sm:w-auto"
            >
              Siguiente
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleConvert}
              disabled={converting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] gap-1.5 w-full sm:w-auto"
            >
              {converting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Confirmar conversión
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
