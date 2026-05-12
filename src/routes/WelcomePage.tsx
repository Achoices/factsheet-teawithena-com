import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { copy, type Locale } from '../lib/i18n'

interface WelcomePageProps {
  locale: Locale
  intervieweeFirstName: string
  /**
   * Required so the CTA can carry the token into /form/subject and every
   * subsequent section route can re-validate it. STEP 2 contract.
   */
  token: string
}

export function WelcomePage({ locale, intervieweeFirstName, token }: WelcomePageProps) {
  const navigate = useNavigate()
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
        onClick={() => navigate(`/form/subject?token=${encodeURIComponent(token)}`)}
        className="font-body uppercase tracking-wider text-sm font-medium bg-accent text-surface px-8 py-3 rounded focus-ring hover:bg-accent-deep transition-colors duration-200"
      >
        {t.cta}
      </button>
    </PageShell>
  )
}
