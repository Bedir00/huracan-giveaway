'use client'

import { useEffect, type ReactNode } from 'react'
import { IconX } from './icons'

/**
 * Bottom sheet on phones, centred dialog from `sm` up.
 *
 * Deliberately one component for both: the same forms are reached from a lead
 * card on a phone and from the detail page on a desktop, and they should not
 * be built twice.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Stop the page behind the sheet from scrolling under the thumb.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center">
      <button
        type="button"
        aria-label="Schließen"
        className="absolute inset-0 bg-black/35 animate-fade"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md'
        } max-h-[92dvh] overflow-y-auto bg-[var(--bg-elevated)] border border-[var(--border)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-lg)] sheet sm:animate-in`}
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 px-4 pt-4 pb-3 bg-[var(--bg-elevated)] border-b border-[var(--border)] rounded-t-2xl">
          <div>
            <h2 className="text-[0.9375rem] font-semibold">{title}</h2>
            {description ? <p className="subtle text-xs mt-0.5">{description}</p> : null}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            aria-label="Schließen"
          >
            <IconX />
          </button>
        </div>
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  )
}
