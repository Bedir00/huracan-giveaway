'use client'

import { useActionState, useRef } from 'react'
import { assignLead } from '@/app/actions/leads'
import { Toast } from '@/components/ui'

/**
 * Admin-only reassignment. Submits on change so handing a lead over is a
 * single interaction - and the new owner gets a notification.
 */
export function AssignLead({
  leadId,
  ownerId,
  owners,
  currentUserId,
}: {
  leadId: string
  ownerId: string | null
  owners: { id: string; name: string }[]
  currentUserId: string
}) {
  const [state, action] = useActionState(assignLead, {})
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="leadId" value={leadId} />
      <div className="flex items-center gap-2">
        <select
          name="ownerId"
          className="select"
          defaultValue={ownerId ?? ''}
          onChange={() => formRef.current?.requestSubmit()}
          aria-label="Zuständigen Mitarbeiter wählen"
        >
          <option value="">Nicht zugewiesen</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>
        {ownerId !== currentUserId ? (
          <button
            type="submit"
            name="ownerId"
            value={currentUserId}
            className="btn btn-secondary btn-sm shrink-0"
            title="Lead selbst übernehmen"
          >
            Übernehmen
          </button>
        ) : null}
      </div>
      <Toast state={state.error ? state : null} />
    </form>
  )
}
