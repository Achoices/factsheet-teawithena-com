import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTokenValidation } from '../hooks/useTokenValidation'
import { copy, defaultLocale, type Locale } from '../lib/i18n'
import { SECTION_IDS, isSectionId, nextSectionId, prevSectionId, sectionIndex, type SectionId } from '../lib/sections'
import { SidebarNav } from '../components/SidebarNav'
import { PageShell } from '../components/PageShell'
import { ErrorPage } from './ErrorPage'
import { AutosaveStatusProvider, useAutosaveStatus } from '../lib/autosaveStatusContext'
import { SubjectSection } from './sections/SubjectSection'

/**
 * STEP 3.1 — Section 01 (Subject) now renders its react-hook-form fields.
 * The other 11 sections still show the STEP 2 placeholder body until their
 * respective STEP 3.x commits.
 *
 * Token discipline: re-validates on mount via useTokenValidation (5 min staleTime).
 * Token failures redirect to /expired, /already-submitted, /not-found, or /error.
 * Section URL is NOT preserved on redirect (per STEP 2 note 6).
 */
export function SectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const query = useTokenValidation(token)

  if (!token) return <Navigate to="/not-found" replace />
  if (!isSectionId(sectionId)) return <Navigate to="/not-found" replace />

  if (query.isPending) {
    const locale = defaultLocale()
    return (
      <PageShell locale={locale}>
        <p className="font-mono text-xs text-muted mt-12 tracking-wider uppercase">
          {copy[locale].loading}
        </p>
      </PageShell>
    )
  }

  if (query.isError) {
    return <ErrorPage locale={defaultLocale()} onRetry={() => query.refetch()} />
  }

  const r = query.data
  if (!r || (!r.valid && r.reason === 'server_error')) {
    return <ErrorPage locale={defaultLocale()} onRetry={() => query.refetch()} />
  }

  if (!r.valid) {
    if (r.reason === 'expired') return <Navigate to="/expired" replace />
    if (r.reason === 'already_submitted') return <Navigate to="/already-submitted" replace />
    if (r.reason === 'token_not_found' || r.reason === 'malformed_token') return <Navigate to="/not-found" replace />
    return <Navigate to="/error" replace />
  }

  // Token valid — render the section shell with autosave status provider
  return (
    <AutosaveStatusProvider>
      <SectionPageBody
        locale={r.interview!.language}
        sectionId={sectionId}
        token={token}
      />
    </AutosaveStatusProvider>
  )
}

interface SectionPageBodyProps {
  locale: Locale
  sectionId: SectionId
  token: string
}

function SectionPageBody({ locale, sectionId, token }: SectionPageBodyProps) {
  const navigate = useNavigate()
  const t = copy[locale]
  const idx = sectionIndex(sectionId)
  const prev = prevSectionId(sectionId)
  const next = nextSectionId(sectionId)
  const sectionTitle = t.sections[sectionId].title

  const goPrev = () => prev && navigate(`/form/${prev}?token=${encodeURIComponent(token)}`)
  const goNext = () => next && navigate(`/form/${next}?token=${encodeURIComponent(token)}`)

  return (
    <div className="min-h-screen bg-surface text-ink flex flex-col md:flex-row">
      <SidebarNav locale={locale} currentSectionId={sectionId} token={token} />

      <main className="flex-1 flex flex-col px-6 py-10 md:px-12 md:py-14 md:max-w-3xl">
        <div className="flex items-baseline justify-between gap-4 mb-10 flex-wrap">
          <p className="eyebrow">{t.form.eyebrow}</p>
          <div className="flex items-baseline gap-4">
            <AutosaveIndicator locale={locale} />
            <p className="font-mono text-[11px] text-muted tracking-wider">
              {t.form.progress(idx + 1, SECTION_IDS.length)}
            </p>
          </div>
        </div>

        <h1 className="font-display font-light text-[2rem] md:text-[2.25rem] text-ink tracking-tight mb-8">
          {sectionTitle}
        </h1>

        {/* STEP 3.1: Subject renders real fields; other 11 sections still show placeholder */}
        <div className="mb-12">
          {sectionId === 'subject' ? (
            <SubjectSection />
          ) : (
            <p className="font-body text-base text-ink-soft leading-relaxed italic">
              {t.form.placeholderBody}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 flex-wrap pt-8 border-t border-rule">
          <button
            type="button"
            onClick={goPrev}
            disabled={!prev}
            className={[
              'font-body text-sm focus-ring px-2 py-2',
              prev ? 'text-ink-soft hover:text-ink' : 'text-muted-soft cursor-not-allowed',
            ].join(' ')}
          >
            ← {t.form.nav.prev}
          </button>

          {next ? (
            <button
              type="button"
              onClick={goNext}
              className="font-body uppercase tracking-wider text-sm font-medium bg-accent text-surface px-8 py-3 rounded focus-ring hover:bg-accent-deep transition-colors duration-200"
            >
              {t.form.nav.next} →
            </button>
          ) : (
            <span className="flex items-baseline gap-3 flex-wrap">
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="font-body uppercase tracking-wider text-sm font-medium bg-accent text-surface px-8 py-3 rounded opacity-60 cursor-not-allowed"
              >
                {t.form.nav.submit}
              </button>
              <span className="font-mono text-[11px] text-muted italic">{t.form.nav.submitNote}</span>
            </span>
          )}
        </div>
      </main>
    </div>
  )
}

function AutosaveIndicator({ locale }: { locale: Locale }) {
  const { status } = useAutosaveStatus()
  const text = copy[locale].form.autosave[status]
  if (!text) return null
  const color =
    status === 'error' ? 'text-danger' :
    status === 'saved' ? 'text-accent-deep' :
    'text-muted'
  return (
    <span
      className={`font-mono text-[11px] tracking-wider ${color}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {text}
    </span>
  )
}
