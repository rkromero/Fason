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
  {
    title: 'LEADS',
    href: '/admin/crm',
    icon: Users,
  },
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Estadísticas',
    href: '/admin/estadisticas',
    icon: BarChart3,
  },
  {
    title: 'Base de Datos',
    href: '/admin/db',
    icon: Database,
  },
  {
    title: 'Configuración',
    href: '/admin/configuracion',
    icon: Settings,
  },
]

export function CRMSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 bg-white border-r border-gray-200 shadow-sm z-20">
      {/* Logo/Header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">CRM</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                'hover:bg-gray-100 active:scale-95',
                isActive
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )}
              />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          © 2024 CRM
        </p>
      </div>
    </aside>
  )
}

