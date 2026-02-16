"use client"

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, UserCog, BarChart3, Settings, Database, LogOut, MoreHorizontal, X, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const sidebarItems: SidebarItem[] = [
  { title: 'Leads', href: '/admin/crm', icon: Users },
  { title: 'Cuentas', href: '/admin/cuentas', icon: Building2 },
  { title: 'Usuarios', href: '/admin/usuarios', icon: UserCog },
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Estadísticas', href: '/admin/estadisticas', icon: BarChart3 },
  { title: 'Base de Datos', href: '/admin/db', icon: Database },
  { title: 'Configuración', href: '/admin/configuracion', icon: Settings },
]

const bottomTabItems: SidebarItem[] = [
  { title: 'Leads', href: '/admin/crm', icon: Users },
  { title: 'Cuentas', href: '/admin/cuentas', icon: Building2 },
  { title: 'Usuarios', href: '/admin/usuarios', icon: UserCog },
  { title: 'Stats', href: '/admin/estadisticas', icon: BarChart3 },
]

const moreMenuItems: SidebarItem[] = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Base de Datos', href: '/admin/db', icon: Database },
  { title: 'Configuración', href: '/admin/configuracion', icon: Settings },
]

export function CRMSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const isMoreActive = moreMenuItems.some((item) => pathname === item.href)

  return (
    <>
      {/* ─── Mobile bottom tab bar ─── */}
      <nav aria-label="Navegación principal" className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--crm-bg-card)] border-t border-[var(--crm-border)] safe-area-bottom">
        <div className="flex items-stretch">
          {bottomTabItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors min-h-[56px]',
                  isActive
                    ? 'text-[var(--crm-primary)]'
                    : 'text-[var(--crm-text-muted)] active:text-[var(--crm-text-secondary)]'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'text-[var(--crm-primary)]')} />
                <span className={cn('text-[10px] font-medium leading-none', isActive && 'font-semibold')}>
                  {item.title}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[var(--crm-primary)]" />
                )}
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors min-h-[56px] relative',
              isMoreActive
                ? 'text-[var(--crm-primary)]'
                : 'text-[var(--crm-text-muted)] active:text-[var(--crm-text-secondary)]'
            )}
          >
            <MoreHorizontal className={cn('h-5 w-5', isMoreActive && 'text-[var(--crm-primary)]')} />
            <span className={cn('text-[10px] font-medium leading-none', isMoreActive && 'font-semibold')}>
              Más
            </span>
            {isMoreActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[var(--crm-primary)]" />
            )}
          </button>
        </div>
      </nav>

      {/* ─── Mobile "Más" overlay ─── */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-[var(--crm-bg-card)] rounded-t-2xl shadow-xl animate-in slide-in-from-bottom duration-200 safe-area-bottom">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--crm-border)]" />
            </div>

            <div className="px-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-semibold text-[var(--crm-text)]">Más opciones</h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center justify-center h-8 w-8 rounded-full text-[var(--crm-text-muted)] hover:bg-[var(--crm-bg-hover)] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-0.5 mb-2">
                {moreMenuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-medium transition-all',
                        isActive
                          ? 'bg-[var(--crm-bg-active)] text-[var(--crm-text)]'
                          : 'text-[var(--crm-text-secondary)] active:bg-[var(--crm-bg-hover)]'
                      )}
                    >
                      <div className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl shrink-0',
                        isActive ? 'bg-[var(--crm-primary)]/10' : 'bg-[var(--crm-bg-subtle)]'
                      )}>
                        <Icon className={cn('h-4.5 w-4.5', isActive ? 'text-[var(--crm-primary)]' : 'text-[var(--crm-text-muted)]')} />
                      </div>
                      <span>{item.title}</span>
                    </Link>
                  )
                })}
              </div>

              <div className="border-t border-[var(--crm-border-light)] pt-2 mb-4">
                <button
                  onClick={() => { setMoreOpen(false); handleLogout() }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-medium w-full text-[var(--crm-danger)] active:bg-[var(--crm-danger-light)] transition-all"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--crm-danger-light)] shrink-0">
                    <LogOut className="h-4.5 w-4.5 text-[var(--crm-danger)]" />
                  </div>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Desktop sidebar (unchanged) ─── */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 bg-[var(--crm-bg-card)] border-r border-[var(--crm-border)] z-20">
        <div className="flex items-center justify-center h-14 px-4 border-b border-[var(--crm-border)]">
          <h2 className="crm-title text-[16px]">Fason CRM</h2>
        </div>

        <nav aria-label="Menú lateral" className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[var(--crm-radius-md)] text-[13px] font-medium',
                  'transition-all duration-[var(--crm-transition)] crm-focus-ring',
                  isActive
                    ? 'bg-[var(--crm-bg-active)] text-[var(--crm-text)] shadow-[var(--crm-shadow-xs)]'
                    : 'text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)] hover:text-[var(--crm-text)] active:scale-[0.98]'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[var(--crm-text)]' : 'text-[var(--crm-text-muted)]')} />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-3 border-t border-[var(--crm-border)]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--crm-radius-md)] text-[13px] font-medium w-full text-[var(--crm-text-muted)] hover:bg-[var(--crm-danger-light)] hover:text-[var(--crm-danger)] transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}
