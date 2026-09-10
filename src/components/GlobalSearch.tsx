'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { STAGE_SHORT, type Stage } from '@/lib/constants'
import { IconSearch, IconX } from './icons'
import { stageVar } from './ui'

type Result = { id: string; company: string; stage: string; meta: string }

/**
 * Header search across companies, contacts, phone numbers, e-mails and
 * websites. Debounced, keyboard-driven (⌘K / Ctrl+K to focus, arrows to move,
 * Enter to open) so the fastest path to a lead never needs the mouse.
 */
export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        const data = (await response.json()) as { results: Result[] }
        setResults(data.results ?? [])
        setCursor(0)
      } catch {
        // Aborted or offline - leave the previous results in place.
      } finally {
        setLoading(false)
      }
    }, 180)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setCursor((c) => Math.min(c + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const target = results[cursor]
      if (target) {
        setOpen(false)
        router.push(`/leads/${target.id}`)
      } else if (query.trim()) {
        setOpen(false)
        router.push(`/leads?q=${encodeURIComponent(query.trim())}`)
      }
    }
  }

  const showPanel = open && query.trim().length >= 2

  return (
    <div className="relative flex-1 max-w-md" ref={boxRef}>
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 subtle pointer-events-none">
        <IconSearch />
      </span>
      <input
        ref={inputRef}
        className="input pl-8 pr-8 h-9"
        placeholder="Firma, Ansprechpartner, Telefon…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        aria-label="Globale Suche"
      />
      {query ? (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 subtle hover:text-[var(--text)]"
          onClick={() => {
            setQuery('')
            inputRef.current?.focus()
          }}
          aria-label="Suche leeren"
        >
          <IconX />
        </button>
      ) : null}

      {showPanel ? (
        <div className="popover absolute left-0 right-0 top-11 z-50 p-1.5 max-h-[70vh] overflow-y-auto">
          {results.length === 0 ? (
            <p className="subtle text-[0.8125rem] px-2 py-3">
              {loading ? 'Suche…' : 'Keine Treffer.'}
            </p>
          ) : (
            results.map((result, index) => (
              <Link
                key={result.id}
                href={`/leads/${result.id}`}
                onClick={() => setOpen(false)}
                onMouseEnter={() => setCursor(index)}
                className="flex items-center gap-2 px-2 py-2 rounded-[10px] transition-colors"
                style={index === cursor ? { background: 'var(--surface-2)' } : undefined}
              >
                <i className="dot" style={{ color: stageVar(result.stage) }} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.8125rem] font-medium truncate">
                    {result.company}
                  </span>
                  {result.meta ? (
                    <span className="block text-[0.6875rem] subtle truncate">{result.meta}</span>
                  ) : null}
                </span>
                <span className="text-[0.6875rem] subtle shrink-0">
                  {STAGE_SHORT[result.stage as Stage] ?? result.stage}
                </span>
              </Link>
            ))
          )}
          <Link
            href={`/leads?q=${encodeURIComponent(query.trim())}`}
            onClick={() => setOpen(false)}
            className="block px-2 py-2 mt-1 text-xs link border-t border-[var(--border)]"
          >
            Alle Ergebnisse in der Lead-Liste →
          </Link>
        </div>
      ) : null}
    </div>
  )
}
