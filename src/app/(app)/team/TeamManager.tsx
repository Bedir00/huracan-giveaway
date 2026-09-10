'use client'

import { useActionState, useEffect, useState } from 'react'
import { reassignLeads, resetUserPassword, saveUser } from '@/app/actions/team'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { IconEdit, IconPlus } from '@/components/icons'
import { Sheet } from '@/components/Sheet'
import { Toast } from '@/components/ui'
import { ROLE_LABELS, ROLES, type Role } from '@/lib/constants'

export type MemberData = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

export function AddMemberButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        <IconPlus />
        Mitarbeiter
      </button>
      {open ? <MemberSheet member={null} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

export function EditMemberButton({ member }: { member: MemberData }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-icon"
        onClick={() => setOpen(true)}
        aria-label={`${member.name} bearbeiten`}
      >
        <IconEdit />
      </button>
      {open ? <MemberSheet member={member} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

function MemberSheet({ member, onClose }: { member: MemberData | null; onClose: () => void }) {
  const [state, action, pending] = useActionState(saveUser, {})

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  return (
    <Sheet
      open
      onClose={onClose}
      title={member ? member.name : 'Mitarbeiter anlegen'}
      description={
        member
          ? 'Rolle, Zugang und Kontaktdaten ändern.'
          : 'Der Mitarbeiter meldet sich anschließend mit E-Mail und Passwort an.'
      }
    >
      <form action={action} className="flex flex-col gap-3.5">
        {member ? <input type="hidden" name="userId" value={member.id} /> : null}
        <Toast state={state} />

        <div className="field">
          <label className="label" htmlFor="member-name">
            Name *
          </label>
          <input
            id="member-name"
            name="name"
            className="input"
            required
            autoFocus
            defaultValue={member?.name ?? ''}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="member-email">
            E-Mail *
          </label>
          <input
            id="member-email"
            name="email"
            type="email"
            className="input"
            required
            autoCapitalize="none"
            defaultValue={member?.email ?? ''}
          />
        </div>

        {!member ? (
          <div className="field">
            <label className="label" htmlFor="member-password">
              Startpasswort *
            </label>
            <input
              id="member-password"
              name="password"
              className="input"
              required
              minLength={8}
              placeholder="mindestens 8 Zeichen"
            />
            <p className="hint">
              Teile es dem Mitarbeiter mit - er kann es unter „Einstellungen“ ändern.
            </p>
          </div>
        ) : null}

        <div className="field">
          <label className="label" htmlFor="member-role">
            Rolle
          </label>
          <select
            id="member-role"
            name="role"
            className="select"
            defaultValue={member?.role ?? 'AGENT'}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role as Role]}
              </option>
            ))}
          </select>
          <p className="hint">Mitarbeiter sehen nur ihre eigenen Leads, Admins sehen alles.</p>
        </div>

        <label className="flex items-center gap-2 text-[0.8125rem] cursor-pointer">
          <input type="checkbox" name="active" defaultChecked={member?.active ?? true} />
          Zugang aktiv
        </label>

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

export function ResetPasswordButton({ member }: { member: MemberData }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(resetUserPassword, {})

  useEffect(() => {
    if (state.ok) setOpen(false)
  }, [state.ok])

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        Passwort
      </button>
      {open ? (
        <Sheet
          open
          onClose={() => setOpen(false)}
          title="Passwort neu setzen"
          description={`${member.name} wird auf allen Geräten abgemeldet.`}
        >
          <form action={action} className="flex flex-col gap-3.5">
            <input type="hidden" name="userId" value={member.id} />
            <Toast state={state} />
            <div className="field">
              <label className="label" htmlFor="reset-password">
                Neues Passwort *
              </label>
              <input
                id="reset-password"
                name="password"
                className="input"
                required
                minLength={8}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <SubmitButton
                pending={pending}
                className="btn btn-primary flex-1"
                pendingLabel="Speichern…"
              >
                Setzen
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

export function ReassignButton({
  member,
  members,
  leadCount,
}: {
  member: MemberData
  members: MemberData[]
  leadCount: number
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(reassignLeads, {})

  useEffect(() => {
    if (state.ok) setOpen(false)
  }, [state.ok])

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen(true)}
        disabled={leadCount === 0}
        title={leadCount === 0 ? 'Keine Leads zugewiesen' : 'Leads übertragen'}
      >
        Übertragen
      </button>
      {open ? (
        <Sheet
          open
          onClose={() => setOpen(false)}
          title="Leads übertragen"
          description={`${leadCount} Leads von ${member.name} an eine andere Person übergeben.`}
        >
          <form action={action} className="flex flex-col gap-3.5">
            <input type="hidden" name="fromId" value={member.id} />
            <Toast state={state} />
            <div className="field">
              <label className="label" htmlFor="reassign-to">
                Neuer Zuständiger
              </label>
              <select id="reassign-to" name="toId" className="select" defaultValue="">
                <option value="">Nicht zugewiesen</option>
                {members
                  .filter((entry) => entry.id !== member.id && entry.active)
                  .map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
              </select>
              <p className="hint">
                Offene Follow-ups wandern mit, damit kein nächster Schritt verloren geht.
              </p>
            </div>
            <div className="flex gap-2">
              <SubmitButton
                pending={pending}
                className="btn btn-primary flex-1"
                pendingLabel="Übertragen…"
              >
                Übertragen
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
