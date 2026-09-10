'use client'

import './globals.css'

/** Last-resort boundary: replaces the whole document, so it ships its own html. */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="de">
      <body>
        <div className="min-h-dvh grid place-items-center p-6 text-center">
          <div>
            <h1 className="text-xl">Unerwarteter Fehler</h1>
            <p className="muted text-[0.8125rem] mt-1.5">
              Die Anwendung konnte nicht geladen werden.
            </p>
            <button type="button" className="btn btn-primary mt-5" onClick={reset}>
              Neu laden
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
