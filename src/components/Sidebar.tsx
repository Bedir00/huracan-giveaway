'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { IconMenu, IconPlus, IconSparkle } from './icons'
import { MOBILE_PRIMARY, type NavItem } from './nav'
import { Avatar } from './ui'

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Sidebar({
  items,
  counts,
  user,
}: {
  items: NavItem[]
  counts: { tasks: number }
  user: { name: string; roleLabel: string }
}) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-[15.5rem] shrink-0 h-dvh sticky top-0 border-r border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-4">
      <div className="flex items-center gap-2 px-2 pb-4">
        <span
          className="flex items-center justify-center w-7 h-7 rounded-lg text-white text-sm"
          style={{ background: 'var(--accent)' }}
        >
          <IconSparkle />
        </span>
        <span className="font-semibold tracking-tight">Akquise</span>
      </div>

      <Link href="/leads/new" className="btn btn-primary btn-block mb-4">
        <IconPlus />
        Neuer Lead
      </Link>

      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const count = item.count ? counts[item.count] : 0
          return (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link"
              // Every nav target is dynamic and DB-backed. Prefetching all of
              // them means each mutation's revalidation re-renders the whole
              // app at once, which visibly delays the mutation itself.
              prefetch={false}
              data-active={isActive(pathname, item.href)}
            >
              {item.icon}
              <span>{item.label}</span>
              {count > 0 ? (
                <span className="nav-count" data-tone="urgent">
                  {count}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-4">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-2 py-2 rounded-[10px] hover:bg-[var(--surface-2)] transition-colors"
        >
          <Avatar name={user.name} />
          <span className="min-w-0">
            <span className="block text-[0.8125rem] font-medium truncate">{user.name}</span>
            <span className="block text-[0.6875rem] subtle truncate">{user.roleLabel}</span>
          </span>
        </Link>
      </div>
    </aside>
  )
}

export function MobileTabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const primary = MOBILE_PRIMARY.map((href) => items.find((i) => i.href === href)).filter(
    (i): i is NavItem => Boolean(i),
  )
  const rest = items.filter((i) => !MOBILE_PRIMARY.includes(i.href))

  return (
    <nav className="tabbar lg:hidden no-print">
      {primary.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="tab"
          prefetch={false}
          data-active={isActive(pathname, item.href)}
        >
          <span className="text-lg leading-none">{item.icon}</span>
          <span>{item.shortLabel ?? item.label}</span>
        </Link>
      ))}
      <MoreTab items={rest} pathname={pathname} />
    </nav>
  )
}

function MoreTab({ items, pathname }: { items: NavItem[]; pathname: string }) {
  const [open, setOpen] = useState(false)
  const active = items.some((item) => isActive(pathname, item.href))

  // Navigating away must close the sheet, otherwise it lingers over the page.
  useEffect(() => setOpen(false), [pathname])

  return (
    <>
      <button
        type="button"
        className="tab"
        data-active={active || open}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-lg leading-none">
          <IconMenu />
        </span>
        <span>Mehr</span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Menü schließen"
            className="fixed inset-0 z-40 bg-black/25 animate-fade"
            onClick={() => setOpen(false)}
          />
          {/* Anchored above the bar so the thumb never leaves the bottom edge. */}
          <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-50 px-3 sheet">
            <div className="popover p-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link"
                  prefetch={false}
                  data-active={isActive(pathname, item.href)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}
