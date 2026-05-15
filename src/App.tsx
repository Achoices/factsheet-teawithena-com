import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { useTokenValidation } from './hooks/useTokenValidation'
import { copy, defaultLocale } from './lib/i18n'
import { PageShell } from './components/PageShell'
import { WelcomePage } from './routes/WelcomePage'
import { ExpiredPage } from './routes/ExpiredPage'
import { AlreadySubmittedPage } from './routes/AlreadySubmittedPage'
import { NotFoundPage } from './routes/NotFoundPage'
import { ErrorPage } from './routes/ErrorPage'
import { SectionPage } from './routes/SectionPage'
import { SubmittedPage } from './routes/SubmittedPage'

/**
 * Root route at `/` — magic-link landing.
 * Reads ?token=, validates via useTokenValidation, renders WelcomePage on success
 * or <Navigate> to the matching error route on logical failure.
 *
 * Static error routes (/expired, /already-submitted, /not-found, /error) are
 * separate top-level Routes; they render with the default locale (de) because
 * the interview record isn't accessible when validation fails.
 */
function RootRoute() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() || null
  const query = useTokenValidation(token)

  if (!token) return <Navigate to="/not-found" replace />

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

  if (r.valid && r.interview) {
    return (
      <WelcomePage
        locale={r.interview.language}
        intervieweeFirstName={r.interview.interviewee_first_name}
        token={token}
      />
    )
  }

  // Logical failure → redirect to a static route (token NOT preserved per STEP 2 note 6)
  if (r.reason === 'expired') return <Navigate to="/expired" replace />
  if (r.reason === 'already_submitted') return <Navigate to="/already-submitted" replace />
  if (r.reason === 'token_not_found' || r.reason === 'malformed_token') {
    return <Navigate to="/not-found" replace />
  }
  return <Navigate to="/error" replace />
}

function App() {
  const locale = defaultLocale()
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/form/:sectionId" element={<SectionPage />} />
        <Route path="/expired" element={<ExpiredPage locale={locale} />} />
        <Route path="/already-submitted" element={<AlreadySubmittedPage locale={locale} />} />
        <Route path="/submitted" element={<SubmittedPage locale={locale} />} />
        <Route path="/not-found" element={<NotFoundPage locale={locale} />} />
        <Route path="/error" element={<ErrorPage locale={locale} />} />
        <Route path="*" element={<NotFoundPage locale={locale} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
