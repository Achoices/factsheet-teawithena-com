import { PageShell } from '../components/PageShell'
import { copy, formatDate, type Locale } from '../lib/i18n'

interface AlreadySubmittedPageProps {
  locale: Locale
  submittedAt?: string
}

export function AlreadySubmittedPage({ locale, submittedAt }: AlreadySubmittedPageProps) {
  const t = copy[locale].alreadySubmitted
  const body = submittedAt ? t.bodyWithDate(formatDate(submittedAt, locale)) : t.body
  return (
    <PageShell locale={locale} pageEyebrow={t.eyebrow}>
      <h1 className="font-display font-light text-3xl text-ink tracking-tight mb-6 mt-4">
        {t.heading}
      </h1>
      <p className="font-body text-base text-ink-soft leading-relaxed">
        {body}
      </p>
    </PageShell>
  )
}
