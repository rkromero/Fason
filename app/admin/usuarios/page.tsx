"use client"

import { useState, useEffect, useCallback } from 'react'
import { User, UserRole, USER_ROLES } from '@/lib/types/user'
import { CRMSidebar } from '@/components/crm-sidebar'
import { SidebarContent } from '@/components/sidebar-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Plus, RefreshCw, Pencil, Trash2, UserPlus, Users, AlertTriangle,
  Loader2,
} from 'lucide-react'

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showDialog, setShowDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formNombre, setFormNombre] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formTelefono, setFormTelefono] = useState('')
  const [formRol, setFormRol] = useState<UserRole>('vendedor')
  const [formPassword, setFormPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const fetchUsers = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      } else {
        setError('No se pudieron cargar los usuarios')
        toast.error('Error al cargar usuarios')
      }
    } catch {
      setError('Error de conexión')
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const openCreateDialog = () => {
    setEditingUser(null)
    setFormNombre('')
    setFormEmail('')
    setFormTelefono('')
    setFormRol('vendedor')
    setFormPassword('')
    setShowDialog(true)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormNombre(user.nombre)
    setFormEmail(user.email)
    setFormTelefono(user.telefono || '')
    setFormRol(user.rol)
    setFormPassword('')
    setShowDialog(true)
  }

  const handleSubmit = async () => {
    if (!formNombre.trim() || !formEmail.trim()) {
      toast.error('Nombre y email son requeridos')
      return
    }
    if (!editingUser && !formPassword) {
      toast.error('La contraseña es requerida')
      return
    }
    if (formPassword && formPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setSubmitting(true)
    try {
      if (editingUser) {
        const body: Record<string, unknown> = { nombre: formNombre, email: formEmail, telefono: formTelefono || undefined, rol: formRol }
        if (formPassword) body.password = formPassword
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const data = await res.json()
          setUsers((prev) => prev.map((u) => u.id === editingUser.id ? data.user : u))
          toast.success('Usuario actualizado')
        } else {
          const err = await res.json().catch(() => ({}))
          toast.error(err.error || 'Error al actualizar')
        }
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: formNombre, email: formEmail, telefono: formTelefono || undefined, rol: formRol, password: formPassword }),
        })
        if (res.ok) {
          const data = await res.json()
          setUsers((prev) => [...prev, data.user])
          toast.success('Usuario creado')
        } else {
          const err = await res.json().catch(() => ({}))
          toast.error(err.error || 'Error al crear')
        }
      }
      setShowDialog(false)
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
        toast.success('Usuario eliminado')
      } else {
        toast.error('Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !user.activo }),
      })
      if (res.ok) {
        const data = await res.json()
        setUsers((prev) => prev.map((u) => u.id === user.id ? data.user : u))
        toast.success(data.user.activo ? 'Usuario activado' : 'Usuario desactivado')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const rolLabel = (rol: UserRole) => USER_ROLES.find((r) => r.id === rol)?.label || rol

  const getInitial = (name: string) => name.charAt(0).toUpperCase()
  const colors = ['bg-blue-600', 'bg-violet-600', 'bg-teal-600', 'bg-pink-600', 'bg-indigo-600', 'bg-orange-500', 'bg-emerald-600', 'bg-rose-500']
  const getColor = (name: string) => { let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return colors[Math.abs(h) % colors.length] }

  return (
    <div className="min-h-screen crm-surface flex">
      <CRMSidebar />

      <SidebarContent>
        {/* Header */}
        <div className="crm-header sticky top-0 z-10 shrink-0">
          <div className="px-3 sm:px-6 py-2.5 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div>
                <h1 className="crm-title text-[16px] sm:text-[18px]">Usuarios</h1>
                <p className="crm-meta crm-mono mt-0.5 text-[10px] sm:text-[11px]">
                  {loading ? <span className="crm-skeleton inline-block w-16 h-3" /> : `${users.length} usuarios`}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button onClick={fetchUsers} variant="ghost" size="sm" disabled={loading}
                  className={cn('h-8 w-8 p-0 rounded-md text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)]', loading && 'animate-spin')}
                  title="Actualizar">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={openCreateDialog} size="sm" className="crm-btn-primary gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Nuevo Usuario</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4">
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--crm-danger-light)]">
                <AlertTriangle className="h-6 w-6 text-[var(--crm-danger)]" />
              </div>
              <p className="crm-subtitle font-semibold">{error}</p>
              <Button onClick={fetchUsers} className="crm-btn-secondary gap-2"><RefreshCw className="h-3.5 w-3.5" /> Reintentar</Button>
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--crm-bg-subtle)]">
                <Users className="h-6 w-6 text-[var(--crm-text-muted)]" />
              </div>
              <p className="crm-subtitle font-semibold">Sin usuarios</p>
              <p className="crm-body">Creá el primer usuario para poder asignar leads.</p>
              <Button onClick={openCreateDialog} className="crm-btn-primary gap-2 mt-2"><Plus className="h-3.5 w-3.5" /> Crear primer usuario</Button>
            </div>
          )}

          {/* Desktop table */}
          {!error && users.length > 0 && (
            <div className="hidden md:block crm-card overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--crm-border-light)] bg-[var(--crm-bg-subtle)]">
                    <th className="px-3 py-2.5 crm-label">Usuario</th>
                    <th className="px-3 py-2.5 crm-label">Email</th>
                    <th className="px-3 py-2.5 crm-label">Teléfono</th>
                    <th className="px-3 py-2.5 crm-label">Rol</th>
                    <th className="px-3 py-2.5 crm-label">Estado</th>
                    <th className="px-3 py-2.5 crm-label text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-[var(--crm-border-light)] hover:bg-[var(--crm-bg-hover)] transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white shrink-0', getColor(user.nombre))}>
                            {getInitial(user.nombre)}
                          </span>
                          <span className="text-[13px] font-medium text-[var(--crm-text)]">{user.nombre}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5"><span className="crm-body">{user.email}</span></td>
                      <td className="px-3 py-2.5"><span className="crm-meta">{user.telefono || '—'}</span></td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          'crm-badge',
                          user.rol === 'admin' ? 'bg-violet-50 text-violet-700' :
                          user.rol === 'vendedor' ? 'bg-blue-50 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        )}>
                          {rolLabel(user.rol)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={cn(
                            'crm-badge cursor-pointer transition-colors',
                            user.activo ? 'bg-[var(--crm-success-light)] text-[var(--crm-success)]' : 'bg-gray-100 text-gray-500'
                          )}
                        >
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditDialog(user)} className="h-7 w-7 flex items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-bg-active)] transition-colors" title="Editar">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(user)} className="h-7 w-7 flex items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-text-muted)] hover:text-[var(--crm-danger)] hover:bg-[var(--crm-danger-light)] transition-colors" title="Eliminar">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile card list */}
          {!error && users.length > 0 && (
            <div className="md:hidden space-y-2">
              {users.map((user) => (
                <div key={user.id} className="crm-card px-3 py-3">
                  {/* Row 1: Avatar + Name + Role badge */}
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-white shrink-0', getColor(user.nombre))}>
                      {getInitial(user.nombre)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--crm-text)] truncate">{user.nombre}</p>
                      <p className="text-[12px] text-[var(--crm-text-secondary)] truncate">{user.email}</p>
                    </div>
                    <span className={cn(
                      'crm-badge !text-[10px] shrink-0',
                      user.rol === 'admin' ? 'bg-violet-50 text-violet-700' :
                      user.rol === 'vendedor' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    )}>
                      {rolLabel(user.rol)}
                    </span>
                  </div>
                  {/* Row 2: Status + Actions */}
                  <div className="flex items-center gap-2 pl-[42px]">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={cn(
                        'crm-badge !text-[10px] cursor-pointer transition-colors',
                        user.activo ? 'bg-[var(--crm-success-light)] text-[var(--crm-success)]' : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </button>
                    {user.telefono && (
                      <span className="text-[11px] text-[var(--crm-text-muted)]">{user.telefono}</span>
                    )}
                    <div className="flex-1" />
                    <button onClick={() => openEditDialog(user)} className="h-8 w-8 flex items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-text-muted)] active:bg-[var(--crm-bg-active)] transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(user)} className="h-8 w-8 flex items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-text-muted)] active:bg-[var(--crm-danger-light)] transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading && (
            <>
              {/* Mobile skeleton */}
              <div className="md:hidden space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="crm-card px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="crm-skeleton h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <div className="crm-skeleton h-3 w-28" />
                        <div className="crm-skeleton h-2.5 w-36" />
                      </div>
                      <div className="crm-skeleton h-5 w-16 rounded" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop skeleton */}
              <div className="hidden md:block crm-card overflow-hidden">
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="crm-skeleton h-7 w-7 rounded-full" />
                      <div className="crm-skeleton h-3 w-32" />
                      <div className="crm-skeleton h-3 w-40 ml-4" />
                      <div className="crm-skeleton h-5 w-16 ml-auto rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SidebarContent>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-[15px] sm:text-[16px]">{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
            <DialogDescription className="text-[12px] sm:text-[13px]">
              {editingUser ? 'Modificá los datos del usuario.' : 'Completá los datos para crear un nuevo usuario.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="crm-label text-[11px] sm:text-[12px]">Nombre <span className="text-red-500">*</span></label>
              <Input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Nombre completo" disabled={submitting} className="h-9 sm:h-10" />
            </div>
            <div className="space-y-1.5">
              <label className="crm-label text-[11px] sm:text-[12px]">Email <span className="text-red-500">*</span></label>
              <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@ejemplo.com" disabled={submitting} className="h-9 sm:h-10" />
            </div>
            <div className="space-y-1.5">
              <label className="crm-label text-[11px] sm:text-[12px]">Teléfono</label>
              <Input value={formTelefono} onChange={(e) => setFormTelefono(e.target.value)} placeholder="+54 11 1234-5678" disabled={submitting} className="h-9 sm:h-10" />
            </div>
            <div className="space-y-1.5">
              <label className="crm-label text-[11px] sm:text-[12px]">
                Contraseña {!editingUser && <span className="text-red-500">*</span>}
              </label>
              <Input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={editingUser ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
                disabled={submitting}
                className="h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="crm-label text-[11px] sm:text-[12px]">Rol</label>
              <Select value={formRol} onValueChange={(v) => setFormRol(v as UserRole)} disabled={submitting}>
                <SelectTrigger className="h-9 sm:h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={submitting} className="w-full sm:w-auto">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="crm-btn-primary w-full sm:w-auto">
              {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Guardando...</> : editingUser ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Eliminar usuario</DialogTitle>
            <DialogDescription className="text-[12px] sm:text-[13px]">
              ¿Estás seguro de eliminar a <strong>{deleteTarget?.nombre}</strong>? Los leads asignados quedarán sin asignar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="w-full sm:w-auto">Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
