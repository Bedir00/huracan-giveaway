import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { toCsv } from '@/lib/csv'

/** Blank CSV with the expected headers plus one example row. */
export async function GET() {
  const user = await getSessionUser()
  if (!user) return new NextResponse('Nicht angemeldet', { status: 401 })

  const headers = [
    'Firma',
    'Branche',
    'Standort',
    'Website',
    'Instagram',
    'LinkedIn',
    'Telefon',
    'E-Mail',
    'Unternehmensgröße',
    'Quelle',
    'Status',
    'Priorität',
    'Potenziale',
    'Ansprechpartner',
    'Position',
    'Notizen',
  ]
  const example = [
    'Muster Bäckerei GmbH',
    'Gastronomie',
    'Köln',
    'muster-baeckerei.de',
    '@musterbaeckerei',
    '',
    '0221 1234567',
    'info@muster-baeckerei.de',
    '6-20',
    'Google Maps',
    'Neu',
    'Warm',
    'Veraltete Website, Keine Meta Ads',
    'Maria Muster',
    'Inhaberin',
    'Filiale in der Innenstadt, viel Laufkundschaft',
  ]

  return new NextResponse(toCsv(headers, [example]), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="lead-import-vorlage.csv"',
    },
  })
}
