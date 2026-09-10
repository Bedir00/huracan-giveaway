import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center p-6 text-center">
      <div>
        <p className="section-title">404</p>
        <h1 className="text-xl mt-2">Nicht gefunden</h1>
        <p className="muted text-[0.8125rem] mt-1.5 max-w-sm">
          Diese Seite oder dieser Lead existiert nicht - oder er liegt bei einem anderen
          Mitarbeiter.
        </p>
        <Link href="/" className="btn btn-primary mt-5">
          Zum Dashboard
        </Link>
      </div>
    </div>
  )
}
