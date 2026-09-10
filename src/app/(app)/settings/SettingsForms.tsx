'use client'

import { useActionState } from 'react'
import { changePassword, updateProfile } from '@/app/actions/auth'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { Toast } from '@/components/ui'

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfile, {})

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <Toast state={state} />
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="field">
          <label className="label" htmlFor="profile-name">
            Name
          </label>
          <input id="profile-name" name="name" className="input" required defaultValue={name} />
        </div>
        <div className="field">
          <label className="label" htmlFor="profile-email">
            E-Mail
          </label>
          <input
            id="profile-email"
            name="email"
            type="email"
            className="input"
            required
            autoCapitalize="none"
            defaultValue={email}
          />
        </div>
      </div>
      <SubmitButton
        pending={pending}
        className="btn btn-primary self-start"
        pendingLabel="Speichern…"
      >
        Profil speichern
      </SubmitButton>
    </form>
  )
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {})

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <Toast state={state} />
      <div className="field">
        <label className="label" htmlFor="pw-current">
          Aktuelles Passwort
        </label>
        <input
          id="pw-current"
          name="current"
          type="password"
          className="input"
          required
          autoComplete="current-password"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="field">
          <label className="label" htmlFor="pw-next">
            Neues Passwort
          </label>
          <input
            id="pw-next"
            name="next"
            type="password"
            className="input"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="pw-confirm">
            Wiederholen
          </label>
          <input
            id="pw-confirm"
            name="confirm"
            type="password"
            className="input"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
      </div>
      <SubmitButton
        pending={pending}
        className="btn btn-primary self-start"
        pendingLabel="Speichern…"
      >
        Passwort ändern
      </SubmitButton>
    </form>
  )
}
