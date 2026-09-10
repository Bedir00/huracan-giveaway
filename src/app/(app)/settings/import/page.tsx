import Link from 'next/link'
import { Card, CardHeader, PageHeader } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ImportForm } from './ImportForm'

export const metadata = { title: 'CSV-Import' }

const COLUMNS = [
  ['Firma', 'Pflichtfeld - ohne Firmennamen wird die Zeile übersprungen'],
  ['Telefon, E-Mail, Website', 'Kontaktmöglichkeiten, mindestens eine sinnvoll'],
  ['Branche, Standort, Unternehmensgröße', 'optionale Stammdaten'],
  ['Instagram, LinkedIn', 'Handle oder vollständiger Link'],
  ['Quelle', 'z. B. Google Maps, Instagram, Empfehlung, Eigenrecherche'],
  ['Status', 'z. B. Neu, Kontaktiert, Interessiert - sonst „Neu“'],
  ['Priorität', 'Hot, Warm oder Cold'],
  ['Potenziale', 'kommagetrennt, z. B. „Veraltete Website, Keine Meta Ads“'],
  ['Ansprechpartner, Position', 'wird als Hauptansprechpartner angelegt'],
  ['Notizen', 'Freitext'],
]

export default async function ImportPage() {
  const user = await requireUser()
  const isAdmin = user.role === 'ADMIN'

  const owners = isAdmin
    ? await prisma.user.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      })
    : [{ id: user.id, name: user.name }]

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <PageHeader
        title="CSV-Import"
        subtitle="Leads aus Recherche-Listen, Google-Maps-Exporten oder Excel übernehmen."
        actions={
          <Link href="/api/template" className="btn btn-secondary" prefetch={false}>
            Vorlage herunterladen
          </Link>
        }
      />

      <Card>
        <CardHeader title="Datei hochladen" />
        <ImportForm owners={owners} canAssign={isAdmin} currentUserId={user.id} />
      </Card>

      <Card padded={false}>
        <div className="card-pad pb-2">
          <CardHeader
            title="Erkannte Spalten"
            hint="Groß-/Kleinschreibung und Reihenfolge sind egal, unbekannte Spalten werden ignoriert."
          />
        </div>
        <div className="px-5 pb-5 divide-row">
          {COLUMNS.map(([name, description]) => (
            <div key={name} className="py-2">
              <p className="text-[0.8125rem] font-medium">{name}</p>
              <p className="subtle text-xs">{description}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
