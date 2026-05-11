import type { ReactNode } from 'react'
import { copy, type Locale } from '../lib/i18n'

interface PageShellProps {
  locale: Locale
  /** Eyebrow text just below the wordmark; defaults to nothing. */
  pageEyebrow?: string
  children: ReactNode
}

/**
 * Shared layout for every customer-facing page. Cream surface, centered column
 * clamped to comfortable measure, wordmark + optional page-level eyebrow at top,
 * generous vertical breathing room.
 *
 * Pages compose their content as `children`; PageShell handles the chrome.
 */
export function PageShell({ locale, pageEyebrow, children }: PageShellProps) {
  const t = copy[locale]
  return (
    <main className="min-h-screen bg-surface text-ink flex flex-col">
      <header className="pt-14 pb-2 px-6 sm:pt-20 text-center">
        <p className="eyebrow">{t.eyebrow}</p>
        {pageEyebrow && (
          <p className="eyebrow eyebrow-accent mt-2">{pageEyebrow}</p>
        )}
      </header>
      <div className="flex-1 flex items-start justify-center px-6 pt-10 pb-20">
        <article className="w-full max-w-prose text-center">{children}</article>
      </div>
    </main>
  )
}
