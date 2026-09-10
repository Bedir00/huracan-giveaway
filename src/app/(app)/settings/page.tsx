import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { IconDownload, IconLogout, IconUpload } from '@/components/icons'
import { Avatar, Card, CardHeader, DataRow, PageHeader } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { ROLE_LABELS } from '@/lib/constants'
import { fmtDate } from '@/lib/dates'
import { prisma } from '@/lib/db'
import { PasswordForm, ProfileForm } from './SettingsForms'

export const metadata = { title: 'Einstellungen' }

export default async function SettingsPage() {
  const user = await requireUser()
  const [row, leadCount, taskCount] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    prisma.lead.count({ where: { ownerId: user.id } }),
    prisma.task.count({ where: { userId: user.id, done: false } }),
  ])

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <PageHeader title="Einstellungen" subtitle="Dein Zugang, Daten und die App auf dem Handy." />

      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0">
            <p className="font-semibold">{user.name}</p>
            <p className="subtle text-xs">
              {ROLE_LABELS[user.role]} · seit {fmtDate(row.createdAt)}
            </p>
          </div>
          <form action={logout} className="ml-auto">
            <button type="submit" className="btn btn-secondary">
              <IconLogout />
              Abmelden
            </button>
          </form>
        </div>
        <div className="mt-3 pt-3 border-t border-[var(--border)] divide-row">
          <DataRow label="Eigene Leads">{leadCount}</DataRow>
          <DataRow label="Offene Follow-ups">{taskCount}</DataRow>
        </div>
      </Card>

      <Card>
        <CardHeader title="Profil" />
        <ProfileForm name={row.name} email={row.email} />
      </Card>

      <Card>
        <CardHeader title="Passwort" hint="Mindestens 8 Zeichen." />
        <PasswordForm />
      </Card>

      <Card>
        <CardHeader
          title="Import & Export"
          hint="Leads per CSV einlesen oder für externe Auswertungen ausgeben."
        />
        <div className="flex flex-wrap gap-2">
          <Link href="/settings/import" className="btn btn-primary">
            <IconUpload />
            CSV importieren
          </Link>
          <Link href="/api/export/leads" className="btn btn-secondary" prefetch={false}>
            <IconDownload />
            Alle Leads exportieren
          </Link>
          <Link href="/api/template" className="btn btn-ghost" prefetch={false}>
            Import-Vorlage
          </Link>
        </div>
        <p className="hint mt-2">
          Der Export übernimmt die Filter der Lead-Liste - was du dort siehst, landet in der Datei.
        </p>
      </Card>

      <Card>
        <CardHeader
          title="Als App installieren"
          hint="Die Anwendung ist eine Progressive Web App."
        />
        <ul className="flex flex-col gap-2 muted text-[0.8125rem]">
          <li>
            <strong>iPhone / iPad:</strong> in Safari öffnen → Teilen-Symbol → „Zum
            Home-Bildschirm“.
          </li>
          <li>
            <strong>Android:</strong> in Chrome öffnen → Menü → „App installieren“.
          </li>
          <li>
            <strong>Desktop:</strong> in Chrome oder Edge das Installationssymbol in der
            Adressleiste.
          </li>
        </ul>
        <p className="hint mt-2">
          Danach startet die App im Vollbild und lässt sich wie eine normale App nutzen.
        </p>
      </Card>

      <Card>
        <CardHeader title="Tastenkürzel" />
        <div className="divide-row">
          <DataRow label="Globale Suche">⌘ K bzw. Strg K</DataRow>
          <DataRow label="Dialog schließen">Esc</DataRow>
          <DataRow label="Suchtreffer wählen">↑ ↓ und Enter</DataRow>
        </div>
      </Card>
    </div>
  )
}
