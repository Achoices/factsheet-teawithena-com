import { PageShell } from '../components/PageShell'
import { copy, type Locale } from '../lib/i18n'

interface NotFoundPageProps {
  locale: Locale
}

export function NotFoundPage({ locale }: NotFoundPageProps) {
  const t = copy[locale].notFound
  return (
    <PageShell locale={locale} pageEyebrow={t.eyebrow}>
      <h1 className="font-display font-light text-3xl text-ink tracking-tight mb-6 mt-4">
        {t.heading}
      </h1>
      <p className="font-body text-base text-ink-soft leading-relaxed mb-6">
        {t.body}
      </p>
      <p className="font-body text-sm text-muted">
        <a href={`mailto:${t.contact}`} className="text-accent-deep underline decoration-rule hover:decoration-current">
          {t.contact}
        </a>
      </p>
    </PageShell>
  )
}
