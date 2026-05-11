import { PageShell } from '../components/PageShell'
import { copy, type Locale } from '../lib/i18n'

interface ErrorPageProps {
  locale: Locale
  onRetry?: () => void
}

export function ErrorPage({ locale, onRetry }: ErrorPageProps) {
  const t = copy[locale].error
  return (
    <PageShell locale={locale} pageEyebrow={t.eyebrow}>
      <h1 className="font-display font-light text-3xl text-ink tracking-tight mb-6 mt-4">
        {t.heading}
      </h1>
      <p className="font-body text-base text-ink-soft leading-relaxed mb-8">
        {t.body}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="font-body uppercase tracking-wider text-sm font-medium bg-accent text-surface px-8 py-3 rounded focus-ring hover:bg-accent-deep transition-colors duration-200"
        >
          {t.retry}
        </button>
      )}
      <p className="font-body text-sm text-muted mt-6">
        <a href={`mailto:${t.contact}`} className="text-accent-deep underline decoration-rule hover:decoration-current">
          {t.contact}
        </a>
      </p>
    </PageShell>
  )
}
