'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { markNotificationsRead } from '@/app/actions/notifications'
import { fmtRelativeDay } from '@/lib/dates'
import { IconBell, IconCheck } from './icons'

export type BellItem = {
  id: string
  title: string
  body: string | null
  href: string
  createdAt: string
  tone: 'urgent' | 'due' | 'info'
}

/**
 * Deliberately quiet: a small dot instead of a red burst, no sound, no browser
 * push. Overdue follow-ups are the only thing allowed to look urgent.
 */
export function NotificationBell({ items }: { items: BellItem[] }) {
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const urgent = items.filter((i) => i.tone === 'urgent').length

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const toneColor = {
    urgent: 'var(--danger)',
    due: 'var(--warning)',
    info: 'var(--text-subtle)',
  } as const

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        className="btn btn-ghost btn-icon relative"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Benachrichtigungen${items.length ? ` (${items.length})` : ''}`}
        aria-expanded={open}
      >
        <IconBell className="text-base" />
        {items.length > 0 ? (
          <span
            className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full border-2 border-[var(--bg-elevated)]"
            style={{ background: urgent ? 'var(--danger)' : 'var(--accent)' }}
          />
        ) : null}
      </button>

      {open ? (
        <div className="popover absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-1.5rem))] max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)]">
            <span className="section-title">Hinweise</span>
            {items.some((i) => !i.id.startsWith('task-') && !i.id.startsWith('appt-')) ? (
              <form action={markNotificationsRead}>
                <button type="submit" className="btn btn-ghost btn-sm">
                  <IconCheck />
                  Gelesen
                </button>
              </form>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="subtle text-[0.8125rem] px-3 py-6 text-center">
              Alles erledigt. Keine offenen Hinweise.
            </p>
          ) : (
            <div className="p-1.5">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex gap-2.5 px-2 py-2 rounded-[10px] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <i
                    className="dot mt-1.5"
                    style={{ color: toneColor[item.tone] }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block text-[0.8125rem] font-medium">{item.title}</span>
                    {item.body ? (
                      <span className="block text-xs muted truncate">{item.body}</span>
                    ) : null}
                    <span className="block text-[0.6875rem] subtle mt-0.5">
                      {fmtRelativeDay(item.createdAt)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
