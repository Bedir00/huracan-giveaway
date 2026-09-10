'use client'

import { useActionState } from 'react'
import { importLeads, type ImportState } from '@/app/actions/import'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { Toast } from '@/components/ui'

/** CSV import with a duplicate guard that is on by default. */
export function ImportForm({
  owners,
  canAssign,
  currentUserId,
}: {
  owners: { id: string; name: string }[]
  canAssign: boolean
  currentUserId: string
}) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importLeads, {})

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <Toast state={state} />

      <div className="field">
        <label className="label" htmlFor="import-file">
          CSV-Datei *
        </label>
        <input
          id="import-file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          className="input h-auto py-2"
          required
        />
        <p className="hint">
          Komma oder Semikolon als Trennzeichen, erste Zeile sind die Spaltennamen.
        </p>
      </div>

      {canAssign ? (
        <div className="field">
          <label className="label" htmlFor="import-owner">
            Alle Leads zuweisen an
          </label>
          <select id="import-owner" name="ownerId" className="select" defaultValue={currentUserId}>
            <option value="">Nicht zugewiesen</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <label className="flex items-start gap-2 text-[0.8125rem] cursor-pointer">
        <input type="checkbox" name="allowDuplicates" className="mt-0.5" />
        <span>
          Duplikate trotzdem importieren
          <span className="block subtle text-xs">
            Standard: Zeilen, die schon als Lead existieren, werden übersprungen.
          </span>
        </span>
      </label>

      <SubmitButton
        pending={pending}
        className="btn btn-primary self-start"
        pendingLabel="Importiere…"
      >
        Import starten
      </SubmitButton>

      {state.ok ? (
        <div className="card card-pad">
          <p className="text-[0.8125rem] font-medium">
            {state.imported} Leads importiert
            {state.skipped ? `, ${state.skipped} Duplikate übersprungen` : ''}.
          </p>
          {state.problems && state.problems.length > 0 ? (
            <details className="mt-2">
              <summary className="subtle text-xs cursor-pointer">
                Hinweise anzeigen ({state.problems.length})
              </summary>
              <ul className="mt-2 flex flex-col gap-1">
                {state.problems.map((problem) => (
                  <li key={problem} className="subtle text-xs">
                    {problem}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </form>
  )
}
