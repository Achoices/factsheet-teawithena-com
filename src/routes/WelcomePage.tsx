import { PageShell } from '../components/PageShell'
import { copy, type Locale } from '../lib/i18n'

interface WelcomePageProps {
  locale: Locale
  intervieweeFirstName: string
}

export function WelcomePage({ locale, intervieweeFirstName }: WelcomePageProps) {
  const t = copy[locale].welcome
  return (
    <PageShell locale={locale} pageEyebrow={t.eyebrow}>
      <h1 className="font-display font-light text-4xl text-ink tracking-tight mb-8 mt-4">
        {t.heading(intervieweeFirstName)}
      </h1>
      <p className="font-body text-base text-ink-soft leading-relaxed mb-10 mx-auto">
        {t.body}
      </p>
      <button
        type="button"
        className="font-body uppercase tracking-wider text-sm font-medium bg-accent text-surface px-8 py-3 rounded focus-ring opacity-60 cursor-not-allowed"
        disabled
        aria-disabled="true"
      >
        {t.cta}
      </button>
      <p className="font-mono text-xs text-muted mt-4 italic">{t.ctaNote}</p>
    </PageShell>
  )
}
