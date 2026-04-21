"use client"

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function SidebarContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const check = () => setCollapsed(localStorage.getItem('sidebar-collapsed') === 'true')
    check()

    // Listen for storage changes from sidebar toggle
    const onStorage = () => check()
    window.addEventListener('storage', onStorage)

    // Also poll for same-tab changes
    const interval = setInterval(check, 200)
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className={cn(
      'flex-1 flex flex-col min-h-screen pb-[72px] md:pb-0 overflow-x-hidden transition-all duration-200',
      collapsed ? 'md:ml-16' : 'md:ml-64',
      className
    )}>
      {children}
    </div>
  )
}
