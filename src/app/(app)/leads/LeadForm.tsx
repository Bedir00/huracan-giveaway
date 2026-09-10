'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { createLead, updateLead, type LeadFormState } from '@/app/actions/leads'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { IconAlert, IconChevronDown } from '@/components/icons'
import { StagePill, Toast } from '@/components/ui'
import {
  COMPANY_SIZES,
  FOLLOWUP_SUGGESTIONS,
  POTENTIALS,
  PRIORITIES,
  PRIORITY_LABELS,
  SOURCE_LABELS,
  SOURCES,
  STAGE_LABELS,
  STAGES,
} from '@/lib/constants'
import { toDateInput } from '@/lib/dates'

export type LeadFormValues = {
  id?: string
  company: string
  industry: string
  location: string
  website: string
  instagram: string
  linkedin: string
  phone: string
  email: string
  companySize: string
  source: string
  stage: string
  priority: string
  potentials: string[]
  notes: string
  ownerId: string
  dealValue: string
  followupTitle?: string
  followupDate?: string
  followupTime?: string
}

export const EMPTY_LEAD: LeadFormValues = {
  company: '',
  industry: '',
  location: '',
  website: '',
  instagram: '',
  linkedin: '',
  phone: '',
  email: '',
  companySize: '',
  source: 'EIGENRECHERCHE',
  stage: 'NEU',
  priority: 'WARM',
  potentials: [],
  notes: '',
  ownerId: '',
  dealValue: '',
}

type DuplicateMatch = {
  id: string
  company: string
  stage: string
  ownerName: string | null
  reasons: string[]
}

/**
 * One form for creating and editing a lead.
 *
 * Only five fields are required (company, one contact channel, source, status,
 * owner) - everything else sits behind "Weitere Angaben", because the rule is
 * that documenting must never cost more time than selling.
 */
export function LeadForm({
  mode,
  values,
  owners,
  canAssign,
  withFollowup = false,
}: {
  mode: 'create' | 'edit'
  values: LeadFormValues
  owners: { id: string; name: string }[]
  canAssign: boolean
  withFollowup?: boolean
}) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(
    mode === 'create' ? createLead : updateLead,
    {},
  )
  const [company, setCompany] = useState(values.company)
  const [phone, setPhone] = useState(values.phone)
  const [email, setEmail] = useState(values.email)
  const [website, setWebsite] = useState(values.website)
  const [stage, setStage] = useState(values.stage)
  const [expanded, setExpanded] = useState(mode === 'edit')
  const [liveMatches, setLiveMatches] = useState<DuplicateMatch[]>([])

  // React 19 resets uncontrolled inputs after an action settles. When the
  // server sends back a duplicate warning it also echoes what was typed, so
  // the reset restores the entry instead of emptying the form.
  const echo = state.values
  const defaults: LeadFormValues = echo
    ? { ...values, ...echo, dealValue: values.dealValue }
    : values

  useEffect(() => {
    if (!echo) return
    setCompany(echo.company)
    setPhone(echo.phone)
    setEmail(echo.email)
    setWebsite(echo.website)
    if (echo.stage) setStage(echo.stage)
    // Re-open the details panel if the user had filled anything in there.
    if (echo.industry || echo.location || echo.notes || echo.potentials.length) setExpanded(true)
  }, [echo])

  // Live duplicate check: warns while typing, so a colleague's lead is caught
  // before the form is even submitted.
  useEffect(() => {
    if (company.trim().length < 3 && !phone && !email && !website) {
      setLiveMatches([])
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      const search = new URLSearchParams({ company, phone, email, website })
      if (values.id) search.set('exclude', values.id)
      try {
        const response = await fetch(`/api/duplicates?${search.toString()}`, {
          signal: controller.signal,
        })
        const data = (await response.json()) as { matches: DuplicateMatch[] }
        setLiveMatches(data.matches ?? [])
      } catch {
        // Offline or aborted - the server-side check still runs on submit.
      }
    }, 450)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [company, phone, email, website, values.id])

  const serverMatches = state.duplicates ?? []
  const matches = serverMatches.length ? serverMatches : liveMatches
  const blocked = serverMatches.length > 0

  return (
    <form action={action} className="flex flex-col gap-4">
      {values.id ? <input type="hidden" name="leadId" value={values.id} /> : null}
      <Toast state={state.duplicates ? { ...state, error: undefined } : state} />

      {matches.length > 0 ? (
        <div className="toast toast-warning flex-col items-stretch">
          <span className="flex items-center gap-2 font-semibold">
            <IconAlert />
            {blocked ? 'Möglicher Duplikat-Treffer' : 'Achtung: ähnlicher Lead vorhanden'}
          </span>
          <ul className="flex flex-col gap-1.5 mt-2">
            {matches.map((match) => (
              <li key={match.id} className="flex items-center gap-2 flex-wrap">
                <StagePill stage={match.stage} />
                <Link href={`/leads/${match.id}`} className="link font-medium" target="_blank">
                  {match.company}
                </Link>
                <span className="text-[0.6875rem]">
                  {match.ownerName ? `bei ${match.ownerName}` : 'nicht zugewiesen'} · Treffer:{' '}
                  {match.reasons.join(', ')}
                </span>
              </li>
            ))}
          </ul>
          {blocked ? (
            <p className="text-xs mt-2">
              Wenn es sich wirklich um ein anderes Unternehmen handelt, kannst du unten trotzdem
              anlegen.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* --- the mandatory minimum --- */}
      <div className="card card-pad flex flex-col gap-3.5">
        <div className="field">
          <label className="label" htmlFor="company">
            Firmenname *
          </label>
          <input
            id="company"
            name="company"
            className="input"
            required
            autoFocus={mode === 'create'}
            autoComplete="organization"
            placeholder="z. B. Muster Bäckerei GmbH"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="field">
            <label className="label" htmlFor="phone">
              Telefon
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="input"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0221 1234567"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="email">
              E-Mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              autoCapitalize="none"
              placeholder="info@firma.de"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="field sm:col-span-2">
            <label className="label" htmlFor="website">
              Website
            </label>
            <input
              id="website"
              name="website"
              className="input"
              inputMode="url"
              autoCapitalize="none"
              placeholder="firma.de"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>
        </div>
        <p className="hint -mt-1">
          Mindestens eine Kontaktmöglichkeit genügt - Telefon, E-Mail, Website, Instagram oder
          LinkedIn.
        </p>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="field">
            <label className="label" htmlFor="source">
              Quelle *
            </label>
            <select id="source" name="source" className="select" defaultValue={defaults.source}>
              {SOURCES.map((source) => (
                <option key={source} value={source}>
                  {SOURCE_LABELS[source]}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="stage">
              Status *
            </label>
            <select
              id="stage"
              name="stage"
              className="select"
              value={stage}
              onChange={(event) => setStage(event.target.value)}
              disabled={mode === 'edit'}
            >
              {STAGES.map((option) => (
                <option key={option} value={option}>
                  {STAGE_LABELS[option]}
                </option>
              ))}
            </select>
            {mode === 'edit' ? (
              <p className="hint">Status wird über die Pipeline oder „Status ändern“ gesetzt.</p>
            ) : null}
          </div>

          <div className="field">
            <label className="label" htmlFor="ownerId">
              Zuständig *
            </label>
            <select
              id="ownerId"
              name="ownerId"
              className="select"
              defaultValue={defaults.ownerId}
              disabled={!canAssign}
            >
              {canAssign ? <option value="">Nicht zugewiesen</option> : null}
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
            {!canAssign ? (
              <p className="hint">Neue Leads landen auf deiner eigenen Liste.</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* --- optional first follow-up --- */}
      {withFollowup ? (
        <div className="card card-pad">
          <p className="section-title mb-2.5">Nächster Schritt (optional)</p>
          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3">
            <div className="field">
              <label className="label" htmlFor="followupTitle">
                Aufgabe
              </label>
              <input
                id="followupTitle"
                name="followupTitle"
                className="input"
                defaultValue={defaults.followupTitle ?? ''}
                list="lead-followups"
                placeholder="z. B. morgen anrufen"
              />
              <datalist id="lead-followups">
                {FOLLOWUP_SUGGESTIONS.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </div>
            <div className="field">
              <label className="label" htmlFor="followupDate">
                Datum
              </label>
              <input
                id="followupDate"
                name="followupDate"
                type="date"
                className="input"
                defaultValue={
                  defaults.followupDate || toDateInput(new Date(Date.now() + 86_400_000))
                }
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="followupTime">
                Uhrzeit
              </label>
              <input
                id="followupTime"
                name="followupTime"
                type="time"
                className="input"
                defaultValue={defaults.followupTime ?? ''}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* --- everything else --- */}
      <div className="card">
        <button
          type="button"
          className="flex items-center justify-between w-full card-pad text-left"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <span>
            <span className="text-[0.9375rem] font-semibold block">Weitere Angaben</span>
            <span className="subtle text-xs">
              Branche, Standort, Social Media, Potenziale, Notizen
            </span>
          </span>
          <IconChevronDown
            className="text-base subtle transition-transform"
            style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
          />
        </button>

        {expanded ? (
          <div className="px-5 pb-5 flex flex-col gap-3.5 animate-in">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="field">
                <label className="label" htmlFor="industry">
                  Branche
                </label>
                <input
                  id="industry"
                  name="industry"
                  className="input"
                  defaultValue={defaults.industry}
                  placeholder="z. B. Gastronomie"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="location">
                  Standort
                </label>
                <input
                  id="location"
                  name="location"
                  className="input"
                  defaultValue={defaults.location}
                  placeholder="z. B. Köln"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="instagram">
                  Instagram
                </label>
                <input
                  id="instagram"
                  name="instagram"
                  className="input"
                  autoCapitalize="none"
                  defaultValue={defaults.instagram}
                  placeholder="@handle"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="linkedin">
                  LinkedIn
                </label>
                <input
                  id="linkedin"
                  name="linkedin"
                  className="input"
                  autoCapitalize="none"
                  defaultValue={defaults.linkedin}
                  placeholder="Profil- oder Firmenlink"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="companySize">
                  Unternehmensgröße
                </label>
                <select
                  id="companySize"
                  name="companySize"
                  className="select"
                  defaultValue={defaults.companySize}
                >
                  <option value="">Unbekannt</option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size} Mitarbeiter
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="priority">
                  Priorität
                </label>
                <select
                  id="priority"
                  name="priority"
                  className="select"
                  defaultValue={defaults.priority}
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {PRIORITY_LABELS[priority]}
                    </option>
                  ))}
                </select>
              </div>
              {mode === 'edit' ? (
                <div className="field">
                  <label className="label" htmlFor="dealValue">
                    Auftragswert (€)
                  </label>
                  <input
                    id="dealValue"
                    name="dealValue"
                    className="input"
                    inputMode="decimal"
                    defaultValue={values.dealValue}
                    placeholder="z. B. 2500"
                  />
                </div>
              ) : null}
            </div>

            <div className="field">
              <span className="label">Erkanntes Potenzial (Mehrfachauswahl)</span>
              <div className="flex flex-wrap gap-1.5">
                {POTENTIALS.map((potential) => (
                  <label key={potential.key} className="chip-toggle">
                    <input
                      type="checkbox"
                      name="potentials"
                      value={potential.key}
                      defaultChecked={defaults.potentials.includes(potential.key)}
                    />
                    {potential.label}
                  </label>
                ))}
              </div>
              <p className="hint">
                Daraus schlägt die App später den passenden Akquise-Ansatz vor.
              </p>
            </div>

            <div className="field">
              <label className="label" htmlFor="notes">
                Notizen
              </label>
              <textarea
                id="notes"
                name="notes"
                className="textarea"
                rows={3}
                defaultValue={defaults.notes}
                placeholder="Was ist bei diesem Unternehmen aufgefallen?"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-4 py-2">
        <SubmitButton
          pending={pending}
          className="btn btn-primary btn-lg flex-1 sm:flex-none"
          pendingLabel="Speichern…"
        >
          {mode === 'create' ? 'Lead anlegen' : 'Änderungen speichern'}
        </SubmitButton>

        {blocked ? (
          <SubmitButton
            pending={pending}
            className="btn btn-secondary btn-lg"
            name="force"
            value="1"
            pendingLabel="Anlegen…"
          >
            Trotzdem anlegen
          </SubmitButton>
        ) : null}

        <Link href={values.id ? `/leads/${values.id}` : '/leads'} className="btn btn-ghost btn-lg">
          Abbrechen
        </Link>
      </div>
    </form>
  )
}
