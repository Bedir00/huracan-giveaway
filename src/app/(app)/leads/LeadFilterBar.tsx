'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { IconDownload, IconFilter, IconSearch, IconX } from '@/components/icons'
import {
  POTENTIALS,
  PRIORITIES,
  PRIORITY_LABELS,
  SOURCE_LABELS,
  SOURCES,
  STAGE_LABELS,
  STAGES,
} from '@/lib/constants'

export type FilterOption = { value: string; label: string }

const VIEWS: FilterOption[] = [
  { value: '', label: 'Alle' },
  { value: 'active', label: 'Aktiv' },
  { value: 'won', label: 'Gewonnen' },
  { value: 'lost', label: 'Verloren' },
]

const DUE_OPTIONS: FilterOption[] = [
  { value: '', label: 'Alle' },
  { value: 'today', label: 'Heute fällig' },
  { value: 'overdue', label: 'Überfällig' },
  { value: 'week', label: 'Diese Woche' },
  { value: 'none', label: 'Ohne nächsten Schritt' },
]

const SORT_OPTIONS: FilterOption[] = [
  { value: 'recent', label: 'Zuletzt bearbeitet' },
  { value: 'oldest', label: 'Älteste zuerst' },
  { value: 'company', label: 'Firma A-Z' },
  { value: 'stage', label: 'Pipeline-Stufe' },
  { value: 'contact', label: 'Längster Kontaktabstand' },
  { value: 'value', label: 'Auftragswert' },
]

/**
 * Filter bar for the lead list.
 *
 * Filters live in the URL, which makes any view shareable, bookmarkable and
 * exportable - the CSV export simply reuses the same query string.
 */
export function LeadFilterBar({
  owners,
  industries,
  isAdmin,
  total,
}: {
  owners: FilterOption[]
  industries: string[]
  isAdmin: boolean
  total: number
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState(params.get('q') ?? '')

  const get = (key: string) => params.get(key) ?? ''

  // Keep the input in sync when navigation changes the URL (back button, links).
  useEffect(() => setQuery(params.get('q') ?? ''), [params])

  function apply(next: Record<string, string>) {
    const search = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value)
      else search.delete(key)
    }
    startTransition(() => router.push(`/leads?${search.toString()}`, { scroll: false }))
  }

  // Debounce the free-text search so typing does not fire a request per key.
  useEffect(() => {
    const current = params.get('q') ?? ''
    if (query === current) return
    const timer = setTimeout(() => apply({ q: query }), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const detailKeys = [
    'stage',
    'owner',
    'industry',
    'source',
    'priority',
    'potential',
    'due',
    'from',
    'to',
  ]
  const activeCount = detailKeys.filter((key) => get(key)).length
  const exportQuery = params.toString()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 subtle pointer-events-none">
            <IconSearch />
          </span>
          <input
            className="input pl-8"
            placeholder="Firma, Ansprechpartner, Telefon, E-Mail…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Leads durchsuchen"
          />
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <IconFilter />
          <span className="hidden sm:inline">Filter</span>
          {activeCount > 0 ? <span className="badge badge-accent">{activeCount}</span> : null}
        </button>

        <select
          className="select w-auto hidden md:block"
          value={get('sort') || 'recent'}
          onChange={(event) => apply({ sort: event.target.value })}
          aria-label="Sortierung"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Link
          href={`/api/export/leads${exportQuery ? `?${exportQuery}` : ''}`}
          className="btn btn-secondary"
          title="Aktuelle Auswahl als CSV exportieren"
          prefetch={false}
        >
          <IconDownload />
          <span className="hidden lg:inline">Export</span>
        </Link>
      </div>

      {/* Quick views - the four states people actually switch between. */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {VIEWS.map((view) => {
          const active = get('view') === view.value
          return (
            <button
              key={view.value || 'all'}
              type="button"
              className="chip-toggle"
              style={
                active
                  ? {
                      background: 'var(--accent-soft)',
                      borderColor: 'var(--accent-border)',
                      color: 'var(--accent)',
                      fontWeight: 600,
                    }
                  : undefined
              }
              onClick={() => apply({ view: view.value })}
            >
              {view.label}
            </button>
          )
        })}
        <span className="w-px h-5 bg-[var(--border)] mx-1" />
        {DUE_OPTIONS.slice(1, 3).map((option) => {
          const active = get('due') === option.value
          return (
            <button
              key={option.value}
              type="button"
              className="chip-toggle"
              style={
                active
                  ? {
                      background: 'var(--danger-soft)',
                      borderColor: 'var(--danger)',
                      color: 'var(--danger)',
                      fontWeight: 600,
                    }
                  : undefined
              }
              onClick={() => apply({ due: active ? '' : option.value })}
            >
              {option.label}
            </button>
          )
        })}
        <span className="subtle text-xs ml-auto tabular">
          {pending ? 'Lädt…' : `${total} ${total === 1 ? 'Lead' : 'Leads'}`}
        </span>
      </div>

      {expanded ? (
        <div className="card card-pad animate-in">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select
              label="Status"
              value={get('stage')}
              onChange={(value) => apply({ stage: value })}
              options={[
                { value: '', label: 'Alle Stufen' },
                ...STAGES.map((stage) => ({ value: stage, label: STAGE_LABELS[stage] })),
              ]}
            />
            {isAdmin ? (
              <Select
                label="Mitarbeiter"
                value={get('owner')}
                onChange={(value) => apply({ owner: value })}
                options={[
                  { value: '', label: 'Alle' },
                  { value: 'none', label: 'Nicht zugewiesen' },
                  ...owners,
                ]}
              />
            ) : null}
            <Select
              label="Branche"
              value={get('industry')}
              onChange={(value) => apply({ industry: value })}
              options={[
                { value: '', label: 'Alle Branchen' },
                ...industries.map((industry) => ({ value: industry, label: industry })),
              ]}
            />
            <Select
              label="Quelle"
              value={get('source')}
              onChange={(value) => apply({ source: value })}
              options={[
                { value: '', label: 'Alle Quellen' },
                ...SOURCES.map((source) => ({ value: source, label: SOURCE_LABELS[source] })),
              ]}
            />
            <Select
              label="Priorität"
              value={get('priority')}
              onChange={(value) => apply({ priority: value })}
              options={[
                { value: '', label: 'Alle' },
                ...PRIORITIES.map((priority) => ({
                  value: priority,
                  label: PRIORITY_LABELS[priority],
                })),
              ]}
            />
            <Select
              label="Potenzial"
              value={get('potential')}
              onChange={(value) => apply({ potential: value })}
              options={[
                { value: '', label: 'Alle' },
                ...POTENTIALS.map((potential) => ({
                  value: potential.key,
                  label: potential.label,
                })),
              ]}
            />
            <Select
              label="Nächste Aufgabe"
              value={get('due')}
              onChange={(value) => apply({ due: value })}
              options={DUE_OPTIONS}
            />
            <Select
              label="Sortierung"
              value={get('sort') || 'recent'}
              onChange={(value) => apply({ sort: value })}
              options={SORT_OPTIONS}
            />
            <div className="field">
              <label className="label" htmlFor="filter-from">
                Angelegt ab
              </label>
              <input
                id="filter-from"
                type="date"
                className="input"
                value={get('from')}
                onChange={(event) => apply({ from: event.target.value })}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="filter-to">
                Angelegt bis
              </label>
              <input
                id="filter-to"
                type="date"
                className="input"
                value={get('to')}
                onChange={(event) => apply({ to: event.target.value })}
              />
            </div>
          </div>

          {activeCount > 0 ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-3"
              onClick={() => router.push('/leads')}
            >
              <IconX />
              Filter zurücksetzen
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
}) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      <select className="select" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
