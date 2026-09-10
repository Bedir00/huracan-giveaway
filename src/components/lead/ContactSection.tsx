'use client'

import { useActionState, useEffect, useState } from 'react'
import { deleteContact, saveContact } from '@/app/actions/leads'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { IconEdit, IconMail, IconPhone, IconPlus, IconTrash } from '@/components/icons'
import { Sheet } from '@/components/Sheet'
import { Toast } from '@/components/ui'
import { CHANNEL_LABELS, CHANNELS, type Channel } from '@/lib/constants'
import { telHref } from '@/lib/format'
import { mailtoHref } from './helpers'

export type ContactData = {
  id: string
  name: string
  position: string | null
  phone: string | null
  email: string | null
  preferredChannel: string | null
  isPrimary: boolean
}

/** Several contacts per company, with the primary one pinned to the top. */
export function ContactSection({ leadId, contacts }: { leadId: string; contacts: ContactData[] }) {
  const [editing, setEditing] = useState<ContactData | 'new' | null>(null)

  return (
    <div className="card">
      <div className="card-pad flex items-center justify-between gap-3 pb-2">
        <div>
          <h2 className="text-[0.9375rem] font-semibold">Ansprechpartner</h2>
          <p className="subtle text-xs mt-0.5">
            {contacts.length === 0
              ? 'Noch niemand hinterlegt'
              : `${contacts.length} ${contacts.length === 1 ? 'Person' : 'Personen'}`}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setEditing('new')}
        >
          <IconPlus />
          Hinzufügen
        </button>
      </div>

      {contacts.length > 0 ? (
        <div className="px-5 pb-4 divide-row">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-start gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[0.8125rem] font-medium flex items-center gap-1.5 flex-wrap">
                  {contact.name}
                  {contact.isPrimary ? <span className="badge badge-accent">Haupt</span> : null}
                </p>
                {contact.position ? <p className="subtle text-xs">{contact.position}</p> : null}
                <div className="flex items-center gap-2 flex-wrap mt-1.5">
                  {contact.phone ? (
                    <a href={telHref(contact.phone) ?? '#'} className="btn btn-secondary btn-sm">
                      <IconPhone />
                      {contact.phone}
                    </a>
                  ) : null}
                  {contact.email ? (
                    <a href={mailtoHref(contact.email) ?? '#'} className="btn btn-secondary btn-sm">
                      <IconMail />
                      <span className="truncate max-w-[10rem]">{contact.email}</span>
                    </a>
                  ) : null}
                  {contact.preferredChannel ? (
                    <span className="badge badge-neutral">
                      am besten per {CHANNEL_LABELS[contact.preferredChannel as Channel]}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => setEditing(contact)}
                  aria-label={`${contact.name} bearbeiten`}
                >
                  <IconEdit />
                </button>
                <form action={deleteContact}>
                  <input type="hidden" name="leadId" value={leadId} />
                  <input type="hidden" name="contactId" value={contact.id} />
                  <button
                    type="submit"
                    className="btn btn-ghost btn-sm btn-icon"
                    aria-label={`${contact.name} entfernen`}
                  >
                    <IconTrash />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {editing ? (
        <ContactSheet
          leadId={leadId}
          contact={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  )
}

function ContactSheet({
  leadId,
  contact,
  onClose,
}: {
  leadId: string
  contact: ContactData | null
  onClose: () => void
}) {
  const [state, action, pending] = useActionState(saveContact, {})

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  return (
    <Sheet
      open
      onClose={onClose}
      title={contact ? 'Ansprechpartner bearbeiten' : 'Ansprechpartner hinzufügen'}
    >
      <form action={action} className="flex flex-col gap-3.5">
        <input type="hidden" name="leadId" value={leadId} />
        {contact ? <input type="hidden" name="contactId" value={contact.id} /> : null}
        <Toast state={state} />

        <div className="field">
          <label className="label" htmlFor="contact-name">
            Name *
          </label>
          <input
            id="contact-name"
            name="name"
            className="input"
            required
            autoFocus
            defaultValue={contact?.name ?? ''}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="contact-position">
            Position
          </label>
          <input
            id="contact-position"
            name="position"
            className="input"
            defaultValue={contact?.position ?? ''}
            placeholder="z. B. Inhaber, Marketingleitung"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="field">
            <label className="label" htmlFor="contact-phone">
              Telefon
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              className="input"
              defaultValue={contact?.phone ?? ''}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="contact-email">
              E-Mail
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              className="input"
              autoCapitalize="none"
              defaultValue={contact?.email ?? ''}
            />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="contact-channel">
            Bevorzugter Kontaktweg
          </label>
          <select
            id="contact-channel"
            name="preferredChannel"
            className="select"
            defaultValue={contact?.preferredChannel ?? ''}
          >
            <option value="">Keine Angabe</option>
            {CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {CHANNEL_LABELS[channel]}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-[0.8125rem] cursor-pointer">
          <input type="checkbox" name="isPrimary" defaultChecked={contact?.isPrimary ?? false} />
          Hauptansprechpartner
        </label>

        <div className="flex gap-2 pt-1">
          <SubmitButton
            pending={pending}
            className="btn btn-primary flex-1"
            pendingLabel="Speichern…"
          >
            Speichern
          </SubmitButton>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </form>
    </Sheet>
  )
}
