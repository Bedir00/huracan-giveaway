'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  deleteAppointment,
  saveAppointment,
  setAppointmentResult,
} from '@/app/actions/appointments'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { IconEdit, IconPlus, IconTrash } from '@/components/icons'
import { Sheet } from '@/components/Sheet'
import { Toast } from '@/components/ui'
import {
  APPOINTMENT_KIND_LABELS,
  APPOINTMENT_KINDS,
  APPOINTMENT_RESULT_LABELS,
  APPOINTMENT_RESULTS,
  type AppointmentKind,
  type AppointmentResult,
} from '@/lib/constants'
import { fmtDateTime, toDateInput, toTimeInput } from '@/lib/dates'

export type AppointmentData = {
  id: string
  startsAt: string
  durationMin: number
  kind: string
  participants: string | null
  notes: string | null
  result: string | null
  userName: string
}

export function AppointmentSection({
  leadId,
  appointments,
}: {
  leadId: string
  appointments: AppointmentData[]
}) {
  const [editing, setEditing] = useState<AppointmentData | 'new' | null>(null)

  return (
    <div className="card">
      <div className="card-pad flex items-center justify-between gap-3 pb-2">
        <div>
          <h2 className="text-[0.9375rem] font-semibold">Termine</h2>
          <p className="subtle text-xs mt-0.5">
            {appointments.length === 0
              ? 'Kein Termin vereinbart'
              : `${appointments.length} Termine`}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setEditing('new')}
        >
          <IconPlus />
          Termin
        </button>
      </div>

      {appointments.length > 0 ? (
        <div className="px-5 pb-4 divide-row">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="py-2.5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.8125rem] font-medium">
                    {fmtDateTime(appointment.startsAt)}
                    <span className="subtle font-normal"> · {appointment.durationMin} Min</span>
                  </p>
                  <p className="subtle text-xs mt-0.5">
                    {APPOINTMENT_KIND_LABELS[appointment.kind as AppointmentKind]} ·{' '}
                    {appointment.userName}
                    {appointment.participants ? ` · ${appointment.participants}` : ''}
                  </p>
                  {appointment.notes ? (
                    <p className="muted text-xs mt-1 whitespace-pre-line">{appointment.notes}</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => setEditing(appointment)}
                    aria-label="Termin bearbeiten"
                  >
                    <IconEdit />
                  </button>
                  <form action={deleteAppointment}>
                    <input type="hidden" name="appointmentId" value={appointment.id} />
                    <button
                      type="submit"
                      className="btn btn-ghost btn-sm btn-icon"
                      aria-label="Termin löschen"
                    >
                      <IconTrash />
                    </button>
                  </form>
                </div>
              </div>

              {/* Recording the outcome should be one tap, not a form. */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {APPOINTMENT_RESULTS.map((result) => {
                  const active = (appointment.result ?? 'OPEN') === result
                  return (
                    <form key={result} action={setAppointmentResult}>
                      <input type="hidden" name="appointmentId" value={appointment.id} />
                      <input type="hidden" name="result" value={result} />
                      <button
                        type="submit"
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
                      >
                        {APPOINTMENT_RESULT_LABELS[result as AppointmentResult]}
                      </button>
                    </form>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {editing ? (
        <AppointmentSheet
          leadId={leadId}
          appointment={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  )
}

function AppointmentSheet({
  leadId,
  appointment,
  onClose,
}: {
  leadId: string
  appointment: AppointmentData | null
  onClose: () => void
}) {
  const [state, action, pending] = useActionState(saveAppointment, {})

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  const start = appointment ? new Date(appointment.startsAt) : null

  return (
    <Sheet open onClose={onClose} title={appointment ? 'Termin bearbeiten' : 'Termin vereinbaren'}>
      <form action={action} className="flex flex-col gap-3.5">
        <input type="hidden" name="leadId" value={leadId} />
        {appointment ? <input type="hidden" name="appointmentId" value={appointment.id} /> : null}
        <Toast state={state} />

        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label className="label" htmlFor="appt-date">
              Datum *
            </label>
            <input
              id="appt-date"
              name="date"
              type="date"
              className="input"
              required
              defaultValue={toDateInput(start ?? new Date())}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="appt-time">
              Uhrzeit *
            </label>
            <input
              id="appt-time"
              name="time"
              type="time"
              className="input"
              required
              defaultValue={start ? toTimeInput(start) : '10:00'}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label className="label" htmlFor="appt-kind">
              Meeting-Art
            </label>
            <select
              id="appt-kind"
              name="kind"
              className="select"
              defaultValue={appointment?.kind ?? 'CALL'}
            >
              {APPOINTMENT_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {APPOINTMENT_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="appt-duration">
              Dauer (Min)
            </label>
            <input
              id="appt-duration"
              name="durationMin"
              type="number"
              min={5}
              step={5}
              className="input"
              defaultValue={appointment?.durationMin ?? 30}
            />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="appt-participants">
            Teilnehmer
          </label>
          <input
            id="appt-participants"
            name="participants"
            className="input"
            defaultValue={appointment?.participants ?? ''}
            placeholder="z. B. Frau Muster, Herr Schmitz"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="appt-notes">
            Notizen
          </label>
          <textarea
            id="appt-notes"
            name="notes"
            className="textarea"
            rows={3}
            defaultValue={appointment?.notes ?? ''}
          />
        </div>

        {appointment ? (
          <div className="field">
            <label className="label" htmlFor="appt-result">
              Ergebnis
            </label>
            <select
              id="appt-result"
              name="result"
              className="select"
              defaultValue={appointment.result ?? 'OPEN'}
            >
              {APPOINTMENT_RESULTS.map((result) => (
                <option key={result} value={result}>
                  {APPOINTMENT_RESULT_LABELS[result]}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="hint">
            Ein neuer Termin setzt den Lead automatisch auf „Termin vereinbart“.
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <SubmitButton
            pending={pending}
            className="btn btn-primary flex-1"
            pendingLabel="Speichern…"
          >
            Speichern
          </SubmitButton>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </form>
    </Sheet>
  )
}
