'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { Toast } from '@/components/ui'

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {})

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <Toast state={state} />

      <div className="field">
        <label className="label" htmlFor="email">
          E-Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          autoComplete="email"
          autoCapitalize="none"
          required
          placeholder="name@firma.de"
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="password">
          Passwort
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      <SubmitButton
        pending={pending}
        className="btn btn-primary btn-lg btn-block mt-1"
        pendingLabel="Anmelden…"
      >
        Anmelden
      </SubmitButton>
    </form>
  )
}
