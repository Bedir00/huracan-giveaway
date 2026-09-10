'use client'

import type { ReactNode } from 'react'

/**
 * Submit button that disables itself while its action runs, so a double tap on
 * a phone cannot create the same record twice.
 *
 * The pending flag is passed in from `useActionState`'s third tuple element
 * rather than read via `useFormStatus`: when a server action calls
 * `revalidatePath`, the `useFormStatus` pending flag never clears and the
 * button stays stuck on its pending label.
 */
export function SubmitButton({
  children,
  pending = false,
  pendingLabel,
  className = 'btn btn-primary',
  formAction,
  name,
  value,
  title,
}: {
  children: ReactNode
  pending?: boolean
  pendingLabel?: string
  className?: string
  formAction?: (formData: FormData) => void | Promise<void>
  name?: string
  value?: string
  title?: string
}) {
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      formAction={formAction}
      name={name}
      value={value}
      title={title}
      aria-busy={pending}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  )
}
