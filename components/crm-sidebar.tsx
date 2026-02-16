"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, BarChart3, Settings, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const sidebarItems: SidebarItem[] = [
  { title: 'LEADS', href: '/admin/crm', icon: Users },
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Estadísticas', href: '/admin/estadisticas', icon: BarChart3 },
  { title: 'Base de Datos', href: '/admin/db', icon: Database },
  { title: 'Configuración', href: '/admin/configuracion', icon: Settings },
]

export function CRMSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 bg-[var(--crm-bg-card)] border-r border-[var(--crm-border)] z-20">
      {/* Logo/Header */}
      <div className="flex items-center justify-center h-14 px-4 border-b border-[var(--crm-border)]">
        <h2 className="crm-title text-[16px]">CRM</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[var(--crm-border)]">
        <p className="crm-meta text-center">© 2024 CRM</p>
      </div>
    </aside>
  )
}
