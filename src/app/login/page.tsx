import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { IconSparkle } from '@/components/icons'
import { getSessionUser } from '@/lib/auth'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Anmelden' }

export default async function LoginPage() {
  if (await getSessionUser()) redirect('/')

  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-[22rem] animate-in">
          <div className="flex items-center gap-2 mb-7">
            <span
              className="flex items-center justify-center w-8 h-8 rounded-[10px] text-white"
              style={{ background: 'var(--accent)' }}
            >
              <IconSparkle />
            </span>
            <span className="font-semibold text-[0.9375rem] tracking-tight">Akquise CRM</span>
          </div>

          <h1 className="text-2xl mb-1.5">Willkommen zurück</h1>
          <p className="muted text-[0.8125rem] mb-6">
            Melde dich an, um deine Leads und Follow-ups zu sehen.
          </p>

          <LoginForm />
        </div>
      </div>

      {/* Decorative panel - hidden on phones where the form should own the screen. */}
      <div
        className="hidden lg:flex flex-col justify-center gap-6 p-12 border-l border-[var(--border)]"
        style={{ background: 'var(--surface-2)' }}
      >
        <p className="text-[1.375rem] font-semibold leading-snug max-w-sm">
          „Wen muss ich heute kontaktieren und was ist bei diesem Lead als Nächstes zu tun?“
        </p>
        <ul className="flex flex-col gap-2.5 muted text-[0.8125rem] max-w-sm">
          {[
            'Lead in unter 20 Sekunden anlegen',
            'Jeder Lead hat immer einen nächsten Schritt',
            'Pipeline per Drag & Drop bewegen',
            'Auf dem Handy wie eine App nutzbar',
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span style={{ color: 'var(--accent)' }}>—</span>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
