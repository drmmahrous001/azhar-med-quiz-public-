'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Stethoscope, Sun, Moon, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DeviceSessionManager } from '@/components/device-session-manager'

const links = [
  { href: '/', label: 'الرئيسية' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [dark, setDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('azhar-theme')
    const enabled = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    setDark(enabled)
    document.documentElement.classList.toggle('dark', enabled)
    document.documentElement.classList.toggle('light', !enabled)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    localStorage.setItem('azhar-theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
    document.documentElement.classList.toggle('light', !next)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 max-w-7xl items-center gap-2 px-3 sm:min-h-16 sm:gap-3 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 font-bold tracking-tight" aria-label="Azhar Med Quiz - الرئيسية">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm sm:size-10">
            <Stethoscope className="size-5" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm sm:text-base">Azhar Med Quiz</span>
            <span className="hidden text-[10px] font-medium text-muted-foreground sm:block">SURGERY QUESTION BANK</span>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            return (
              <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined}
                className={cn('rounded-xl px-2.5 py-2 text-xs font-semibold transition-all lg:px-3 lg:text-sm',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
          <DeviceSessionManager />
          <button type="button" onClick={toggleTheme} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
            className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:border-primary/40 hover:bg-muted">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button type="button" onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={menuOpen} aria-controls="mobile-main-navigation"
            className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:border-primary/40 hover:bg-muted md:hidden">
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <div id="mobile-main-navigation" className={cn('border-t border-border/60 px-3 pb-3 pt-2 md:hidden', menuOpen ? 'block' : 'hidden')}>
        <nav aria-label="Mobile main" className="mx-auto flex max-w-7xl flex-col gap-1">
          {links.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            return (
              <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined}
                className={cn('min-h-11 rounded-xl px-3 py-3 text-sm font-semibold transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
