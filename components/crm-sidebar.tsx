"use client"

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, UserCog, BarChart3, Settings, Database, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const sidebarItems: SidebarItem[] = [
  { title: 'Leads', href: '/admin/crm', icon: Users },
  { title: 'Usuarios', href: '/admin/usuarios', icon: UserCog },
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Estadísticas', href: '/admin/estadisticas', icon: BarChart3 },
  { title: 'Base de Datos', href: '/admin/db', icon: Database },
  { title: 'Configuración', href: '/admin/configuracion', icon: Settings },
]

export function CRMSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const navContent = (
    <>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
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
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center h-12 px-3 bg-[var(--crm-bg-card)] border-b border-[var(--crm-border)]">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center justify-center h-8 w-8 rounded-[var(--crm-radius-md)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)] transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-center text-[14px] font-semibold text-[var(--crm-text)]">Fason CRM</h2>
        <div className="w-8" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-[var(--crm-bg-card)] border-r border-[var(--crm-border)] flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between h-12 px-4 border-b border-[var(--crm-border)]">
              <h2 className="text-[14px] font-semibold text-[var(--crm-text)]">Fason CRM</h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center h-8 w-8 rounded-[var(--crm-radius-md)] text-[var(--crm-text-muted)] hover:bg-[var(--crm-bg-hover)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 bg-[var(--crm-bg-card)] border-r border-[var(--crm-border)] z-20">
        <div className="flex items-center justify-center h-14 px-4 border-b border-[var(--crm-border)]">
          <h2 className="crm-title text-[16px]">Fason CRM</h2>
        </div>
        {navContent}
      </aside>
    </>
  )
}
