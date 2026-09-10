'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/**
 * Route-level error boundary. Keeps the shell intact and offers a retry, so a
 * single failing query does not lose the whole session.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="card card-pad max-w-lg">
      <h1 className="text-lg">Da ist etwas schiefgelaufen</h1>
      <p className="muted text-[0.8125rem] mt-1.5">
        Die Seite konnte nicht geladen werden. Versuche es erneut - deine Daten sind nicht
        betroffen.
      </p>
      {error.digest ? <p className="subtle text-xs mt-2">Referenz: {error.digest}</p> : null}
      <div className="flex gap-2 mt-4">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Erneut versuchen
        </button>
        <Link href="/" className="btn btn-secondary">
          Zum Dashboard
        </Link>
      </div>
    </div>
  )
}
