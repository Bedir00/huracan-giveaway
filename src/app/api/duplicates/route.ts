import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { findDuplicates } from '@/lib/duplicates'

/**
 * Live duplicate check for the lead form. Runs unscoped on purpose: an
 * employee must be warned about a company a colleague already owns, otherwise
 * two people call the same business. Only the owner's name is disclosed.
 */
export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ matches: [] }, { status: 401 })

  const params = new URL(request.url).searchParams
  const matches = await findDuplicates(
    {
      company: params.get('company'),
      website: params.get('website'),
      phone: params.get('phone'),
      email: params.get('email'),
    },
    params.get('exclude') ?? undefined,
  )

  return NextResponse.json({ matches })
}
