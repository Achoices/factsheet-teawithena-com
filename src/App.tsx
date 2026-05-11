import { useMemo } from 'react'
import { useTokenValidation } from './hooks/useTokenValidation'
import { copy, defaultLocale, type Locale } from './lib/i18n'
import { PageShell } from './components/PageShell'
import { WelcomePage } from './routes/WelcomePage'
import { ExpiredPage } from './routes/ExpiredPage'
import { AlreadySubmittedPage } from './routes/AlreadySubmittedPage'
import { NotFoundPage } from './routes/NotFoundPage'
import { ErrorPage } from './routes/ErrorPage'

function readToken(): string | null {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('token')
  return raw && raw.trim() ? raw.trim() : null
}

function App() {
  const token = useMemo(readToken, [])
  const query = useTokenValidation(token)

  // No token in URL → not found (graceful "you arrived without a magic link")
  if (!token) {
    return <NotFoundPage locale={defaultLocale()} />
  }

  // Network / fetch-level failure (invoke threw) → error page in fallback locale
  if (query.isError) {
    return <ErrorPage locale={defaultLocale()} onRetry={() => query.refetch()} />
  }

  // In flight — minimal calm placeholder, no spinner. Default-locale eyebrow.
  if (query.isPending) {
    const locale = defaultLocale()
    const t = copy[locale]
    return (
      <PageShell locale={locale}>
        <p className="font-mono text-xs text-muted mt-12 tracking-wider uppercase">
          {t.loading}
        </p>
      </PageShell>
    )
  }

  const result = query.data

  // Server-error from the Edge Function (logical failure) → error page
  if (!result || result.reason === 'server_error') {
    return <ErrorPage locale={defaultLocale()} onRetry={() => query.refetch()} />
  }

  // Success path — locale comes from the interview record
  if (result.valid && result.interview) {
    const locale: Locale = result.interview.language
    return (
      <WelcomePage
        locale={locale}
        intervieweeFirstName={result.interview.interviewee_first_name}
      />
    )
  }

  // Logical failure paths — locale falls back to default since the interview record
  // wasn't accessible (we don't know the subject's language)
  const fallbackLocale = defaultLocale()
  switch (result.reason) {
    case 'expired':
      return <ExpiredPage locale={fallbackLocale} />
    case 'already_submitted':
      return <AlreadySubmittedPage locale={fallbackLocale} submittedAt={result.submitted_at} />
    case 'malformed_token':
    case 'token_not_found':
      return <NotFoundPage locale={fallbackLocale} />
    default:
      return <ErrorPage locale={fallbackLocale} onRetry={() => query.refetch()} />
  }
}

export default App
