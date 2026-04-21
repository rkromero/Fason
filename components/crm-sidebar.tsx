"use client"

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, UserCog, BarChart3, Settings, Database, LogOut, MoreHorizontal, X, Building2, Search, PanelLeftClose, PanelLeft } from 'lucide-react'
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
  { title: 'Dashboard', href: '/admin/dashboard', icon: Database },
  { title: 'Base de Datos', href: '/admin/db', icon: Database },
  { title: 'Configuración', href: '/admin/configuracion', icon: Settings },
]

export function CRMSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ type: string; id: string; title: string; subtitle: string; href: string }>>([])
  const [searching, setSearching] = useState(false)

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  // Ctrl+K shortcut for global search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setSearchQuery('')
        setSearchResults([])
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [searchOpen])

  // Perform search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const [leadsRes, accountsRes] = await Promise.all([
        fetch(`/api/leads?search=${encodeURIComponent(q)}&limit=5`),
        fetch(`/api/accounts?q=${encodeURIComponent(q)}&limit=5`),
      ])
      const results: typeof searchResults = []

      if (leadsRes.ok) {
        const data = await leadsRes.json()
        for (const lead of (data.leads || []).slice(0, 5)) {
          results.push({ type: 'Lead', id: lead.id, title: lead.nombre, subtitle: `${lead.empresa} · ${lead.email}`, href: '/admin/crm' })
        }
      }
      if (accountsRes.ok) {
        const data = await accountsRes.json()
        for (const acc of (data.accounts || []).slice(0, 5)) {
          results.push({ type: 'Cuenta', id: acc.id, title: acc.empresa, subtitle: acc.nombre || acc.email || '', href: `/admin/cuentas/${acc.id}` })
        }
      }
      setSearchResults(results)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, doSearch])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const isMoreActive = moreMenuItems.some((item) => pathname === item.href)

  const sidebarWidth = collapsed ? 'md:w-16' : 'md:w-64'
  const contentMargin = collapsed ? 'md:ml-16' : 'md:ml-64'

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
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--crm-border)]" />
            </div>
            <div className="px-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-semibold text-[var(--crm-text)]">Más opciones</h3>
                <button onClick={() => setMoreOpen(false)} className="flex items-center justify-center h-8 w-8 rounded-full text-[var(--crm-text-muted)] hover:bg-[var(--crm-bg-hover)] transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile search button */}
              <button
                onClick={() => { setMoreOpen(false); setSearchOpen(true) }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-medium w-full text-[var(--crm-text-secondary)] active:bg-[var(--crm-bg-hover)] transition-all mb-1"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--crm-bg-subtle)] shrink-0">
                  <Search className="h-4.5 w-4.5 text-[var(--crm-text-muted)]" />
                </div>
                <span>Buscar...</span>
              </button>

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
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl shrink-0', isActive ? 'bg-[var(--crm-primary)]/10' : 'bg-[var(--crm-bg-subtle)]')}>
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

      {/* ─── Desktop sidebar (collapsible) ─── */}
      <aside className={cn(
        'hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 bg-[var(--crm-bg-card)] border-r border-[var(--crm-border)] z-20 transition-all duration-200',
        sidebarWidth
      )}>
        {/* Header */}
        <div className={cn('flex items-center h-14 border-b border-[var(--crm-border)]', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
          {!collapsed && <h2 className="crm-title text-[16px]">Fason CRM</h2>}
          <button onClick={toggleCollapsed} aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'} className="flex items-center justify-center h-8 w-8 rounded-md text-[var(--crm-text-muted)] hover:bg-[var(--crm-bg-hover)] hover:text-[var(--crm-text-secondary)] transition-colors">
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Search button */}
        <div className={cn('px-3 pt-3', collapsed && 'px-2')}>
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              'flex items-center gap-2 w-full rounded-[var(--crm-radius-md)] border border-[var(--crm-border)] bg-[var(--crm-bg-subtle)] text-[var(--crm-text-muted)] transition-colors hover:border-[var(--crm-border-hover)] hover:text-[var(--crm-text-secondary)]',
              collapsed ? 'h-9 justify-center px-0' : 'h-9 px-3'
            )}
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && (
              <>
                <span className="text-[12px] flex-1 text-left">Buscar...</span>
                <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--crm-border)] bg-[var(--crm-bg-card)] font-mono">⌘K</kbd>
              </>
            )}
          </button>
        </div>

        <nav aria-label="Menú lateral" className={cn('flex-1 py-3 space-y-0.5 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.title : undefined}
                className={cn(
                  'flex items-center rounded-[var(--crm-radius-md)] text-[13px] font-medium',
                  'transition-all duration-[var(--crm-transition)] crm-focus-ring',
                  collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-[var(--crm-bg-active)] text-[var(--crm-text)] shadow-[var(--crm-shadow-xs)]'
                    : 'text-[var(--crm-text-secondary)] hover:bg-[var(--crm-bg-hover)] hover:text-[var(--crm-text)] active:scale-[0.98]'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[var(--crm-text)]' : 'text-[var(--crm-text-muted)]')} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )
          })}
        </nav>

        <div className={cn('py-3 border-t border-[var(--crm-border)]', collapsed ? 'px-2' : 'px-3')}>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={cn(
              'flex items-center rounded-[var(--crm-radius-md)] text-[13px] font-medium w-full text-[var(--crm-text-muted)] hover:bg-[var(--crm-danger-light)] hover:text-[var(--crm-danger)] transition-all',
              collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2.5'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ─── Global search modal ─── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" role="dialog" aria-modal="true" aria-label="Búsqueda global">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-lg mx-4 bg-[var(--crm-bg-card)] rounded-xl shadow-2xl border border-[var(--crm-border)] overflow-hidden">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--crm-border-light)]">
              <Search className="h-4 w-4 text-[var(--crm-text-muted)] shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar leads, cuentas..."
                className="flex-1 text-[14px] bg-transparent border-none outline-none text-[var(--crm-text)] placeholder:text-[var(--crm-text-muted)]"
                aria-label="Buscar"
              />
              <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded border border-[var(--crm-border)] bg-[var(--crm-bg-subtle)] font-mono text-[var(--crm-text-muted)]">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto">
              {searching && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 border-2 border-[var(--crm-border)] border-t-[var(--crm-primary)] rounded-full animate-spin" />
                </div>
              )}
              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 gap-1">
                  <p className="text-[13px] text-[var(--crm-text-muted)]">Sin resultados para "{searchQuery}"</p>
                </div>
              )}
              {!searching && searchResults.length > 0 && (
                <div className="py-1">
                  {searchResults.map((r) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => {
                        setSearchOpen(false)
                        router.push(r.href)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-[var(--crm-bg-hover)] transition-colors"
                    >
                      <span className={cn(
                        'shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                        r.type === 'Lead' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
                      )}>
                        {r.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[var(--crm-text)] truncate">{r.title}</p>
                        <p className="text-[11px] text-[var(--crm-text-muted)] truncate">{r.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {!searching && searchQuery.length < 2 && (
                <div className="flex flex-col items-center justify-center py-8 gap-1">
                  <p className="text-[12px] text-[var(--crm-text-muted)]">Escribí al menos 2 caracteres para buscar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Export helper for pages to get the correct margin
export function useSidebarMargin() {
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    const check = () => setCollapsed(localStorage.getItem('sidebar-collapsed') === 'true')
    check()
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [])
  return collapsed ? 'md:ml-16' : 'md:ml-64'
}
