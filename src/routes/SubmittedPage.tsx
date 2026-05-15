import { PageShell } from '../components/PageShell'
import { copy, type Locale } from '../lib/i18n'

interface SubmittedPageProps {
  locale: Locale
}

/**
 * Terminal success state shown after the Abschicken click resolves with a
 * 200 from save-fact-sheet ({ok:true, status:'submitted'}). Distinct from
 * /already-submitted, which is the entry-path failure mode when a
 * still-valid token's record has already been submitted in a prior session.
 *
 * Locked copy (Step 6 D-FS2, PM chat 2026-05-15):
 *   DE: "Vielen Dank — der Bogen ist bei uns angekommen. Wir kümmern uns ab
 *        hier um alles Weitere."
 *   EN: "Thank you — the fact sheet has reached us. We'll take it from here."
 */
export function SubmittedPage({ locale }: SubmittedPageProps) {
  const t = copy[locale].submitted
  return (
    <PageShell locale={locale} pageEyebrow={t.eyebrow}>
      <h1 className="font-display font-light text-3xl text-ink tracking-tight mb-6 mt-4">
        {t.heading}
      </h1>
      <p className="font-body text-base text-ink-soft leading-relaxed">
        {t.body}
      </p>
    </PageShell>
  )
}
