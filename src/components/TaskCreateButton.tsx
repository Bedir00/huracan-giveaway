'use client'

import { useActionState, useEffect, useState } from 'react'
import { saveTask } from '@/app/actions/tasks'
import { FOLLOWUP_SUGGESTIONS } from '@/lib/constants'
import { toDateInput } from '@/lib/dates'
import { SubmitButton } from './forms/SubmitButton'
import { IconPlus } from './icons'
import { Sheet } from './Sheet'
import { Toast } from './ui'

/** Standalone follow-up, optionally tied to a lead and to a colleague. */
export function TaskCreateButton({
  leads,
  members,
  currentUserId,
}: {
  leads: { id: string; company: string }[]
  members: { id: string; name: string }[]
  currentUserId: string
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(saveTask, {})

  useEffect(() => {
    if (state.ok) setOpen(false)
  }, [state.ok])

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        <IconPlus />
        Aufgabe
      </button>

      {open ? (
        <Sheet open onClose={() => setOpen(false)} title="Aufgabe anlegen">
          <form action={action} className="flex flex-col gap-3.5">
            <Toast state={state} />

            <div className="field">
              <label className="label" htmlFor="task-title">
                Aufgabe *
              </label>
              <input
                id="task-title"
                name="title"
                className="input"
                required
                autoFocus
                list="task-suggestions"
                placeholder="z. B. Angebot nachfassen"
              />
              <datalist id="task-suggestions">
                {FOLLOWUP_SUGGESTIONS.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="label" htmlFor="task-date">
                  Datum *
                </label>
                <input
                  id="task-date"
                  name="dueDate"
                  type="date"
                  className="input"
                  required
                  defaultValue={toDateInput(new Date())}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="task-time">
                  Uhrzeit
                </label>
                <input id="task-time" name="dueTime" type="time" className="input" />
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="task-lead">
                Lead (optional)
              </label>
              <select id="task-lead" name="leadId" className="select" defaultValue="">
                <option value="">Ohne Lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.company}
                  </option>
                ))}
              </select>
            </div>

            {members.length > 1 ? (
              <div className="field">
                <label className="label" htmlFor="task-user">
                  Zuständig
                </label>
                <select
                  id="task-user"
                  name="userId"
                  className="select"
                  defaultValue={currentUserId}
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="flex gap-2 pt-1">
              <SubmitButton
                pending={pending}
                className="btn btn-primary flex-1"
                pendingLabel="Speichern…"
              >
                Speichern
              </SubmitButton>
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                Abbrechen
              </button>
            </div>
          </form>
        </Sheet>
      ) : null}
    </>
  )
}
