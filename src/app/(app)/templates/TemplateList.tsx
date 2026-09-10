'use client'

import { useActionState, useEffect, useState } from 'react'
import { deleteTemplate, saveTemplate } from '@/app/actions/templates'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { IconCheck, IconCopy, IconEdit, IconPlus, IconTrash } from '@/components/icons'
import { Sheet } from '@/components/Sheet'
import { Card, EmptyState, Toast } from '@/components/ui'
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_CATEGORY_LABELS,
  type TemplateCategory,
} from '@/lib/constants'

export type TemplateData = {
  id: string
  title: string
  category: string
  body: string
}

/**
 * Templates. Employees copy, admins edit.
 *
 * Placeholders like {{firma}} stay as plain text - they are filled in when
 * pasting, which keeps the feature useful without a mail integration.
 */
export function TemplateList({
  templates,
  isAdmin,
}: {
  templates: TemplateData[]
  isAdmin: boolean
}) {
  const [editing, setEditing] = useState<TemplateData | 'new' | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')

  const visible = filter ? templates.filter((t) => t.category === filter) : templates
  const categories = [...new Set(templates.map((t) => t.category))]

  async function copy(template: TemplateData) {
    try {
      await navigator.clipboard.writeText(template.body)
      setCopied(template.id)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      // Clipboard blocked (insecure context) - the text stays selectable.
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          className="chip-toggle"
          style={
            filter === ''
              ? {
                  background: 'var(--accent-soft)',
                  borderColor: 'var(--accent-border)',
                  color: 'var(--accent)',
                  fontWeight: 600,
                }
              : undefined
          }
          onClick={() => setFilter('')}
        >
          Alle
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className="chip-toggle"
            style={
              filter === category
                ? {
                    background: 'var(--accent-soft)',
                    borderColor: 'var(--accent-border)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                  }
                : undefined
            }
            onClick={() => setFilter(category)}
          >
            {TEMPLATE_CATEGORY_LABELS[category as TemplateCategory] ?? category}
          </button>
        ))}
        {isAdmin ? (
          <button
            type="button"
            className="btn btn-primary btn-sm ml-auto"
            onClick={() => setEditing('new')}
          >
            <IconPlus />
            Vorlage
          </button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            title="Noch keine Vorlagen"
            body={
              isAdmin
                ? 'Lege Telefon-Skripte, WhatsApp- und DM-Vorlagen an, damit das Team schneller wird.'
                : 'Sobald der Admin Vorlagen hinterlegt, erscheinen sie hier.'
            }
            action={
              isAdmin ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setEditing('new')}
                >
                  Vorlage anlegen
                </button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {visible.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-[0.9375rem] font-semibold truncate">{template.title}</h3>
                  <span className="badge badge-neutral mt-1">
                    {TEMPLATE_CATEGORY_LABELS[template.category as TemplateCategory] ??
                      template.category}
                  </span>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => setEditing(template)}
                      aria-label="Vorlage bearbeiten"
                    >
                      <IconEdit />
                    </button>
                    <form action={deleteTemplate}>
                      <input type="hidden" name="templateId" value={template.id} />
                      <button
                        type="submit"
                        className="btn btn-ghost btn-sm btn-icon"
                        aria-label="Vorlage löschen"
                      >
                        <IconTrash />
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>

              <pre className="mt-3 p-3 rounded-[10px] bg-[var(--surface-2)] text-[0.8125rem] whitespace-pre-wrap font-sans leading-relaxed flex-1 max-h-64 overflow-y-auto">
                {template.body}
              </pre>

              <button
                type="button"
                className="btn btn-secondary btn-sm mt-3 self-start"
                onClick={() => copy(template)}
              >
                {copied === template.id ? <IconCheck /> : <IconCopy />}
                {copied === template.id ? 'Kopiert' : 'Kopieren'}
              </button>
            </Card>
          ))}
        </div>
      )}

      {editing ? (
        <TemplateSheet
          template={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  )
}

function TemplateSheet({
  template,
  onClose,
}: {
  template: TemplateData | null
  onClose: () => void
}) {
  const [state, action, pending] = useActionState(saveTemplate, {})

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  return (
    <Sheet
      open
      wide
      onClose={onClose}
      title={template ? 'Vorlage bearbeiten' : 'Vorlage anlegen'}
      description="Platzhalter wie {{firma}} oder {{ansprechpartner}} beim Einfügen ersetzen."
    >
      <form action={action} className="flex flex-col gap-3.5">
        {template ? <input type="hidden" name="templateId" value={template.id} /> : null}
        <Toast state={state} />

        <div className="grid sm:grid-cols-[1fr_auto] gap-3">
          <div className="field">
            <label className="label" htmlFor="tpl-title">
              Titel *
            </label>
            <input
              id="tpl-title"
              name="title"
              className="input"
              required
              autoFocus
              defaultValue={template?.title ?? ''}
              placeholder="z. B. Erstanruf Gastronomie"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="tpl-category">
              Kategorie
            </label>
            <select
              id="tpl-category"
              name="category"
              className="select"
              defaultValue={template?.category ?? 'PHONE'}
            >
              {TEMPLATE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {TEMPLATE_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="tpl-body">
            Inhalt *
          </label>
          <textarea
            id="tpl-body"
            name="body"
            className="textarea"
            rows={12}
            required
            defaultValue={template?.body ?? ''}
          />
        </div>

        <div className="flex gap-2">
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
