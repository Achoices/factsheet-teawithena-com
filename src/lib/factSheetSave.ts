// Single autosave + submit entrypoint for the factsheet form.
//
// PERSISTENCE BOUNDARY (Step 5a):
// Form state is string-shaped per factSheetSchema.ts (Zod regex validation
// on plain strings; no .transform()). Persistence shape — YearField{value,approximate}
// for single years, YearRange{start,end} for year ranges, plus derived ISO
// date_of_birth — is produced by normalizeSection.ts and applied here before
// the payload is sent. The Edge Function (save-fact-sheet v2) validates the
// post-normalize shape via Zod with .strict() — extra keys at any nesting
// level produce 422 + reason:'validation_failed'.
//
// PHASE B (Step 6, 2026-05-15): replaced the STEP 3.1 console stub with a
// real supabase.functions.invoke('save-fact-sheet', ...). Token is read
// from FactSheetTokenContext via useSaveFactSheetSection() hook (D-FS3).
// Submit is a separate function (submitFactSheet) called by the Abschicken
// handler after flushing pending autosave (D-EF3).
//
// Retry policy: on network failure (Supabase invoke returns `error`, no
// `data`), silently retry ONCE after 500ms. On the second failure, throw
// — the autosave hook surfaces status='error' to the chrome banner. Zod
// 422 + business-logic 200+{ok:false} are application-level errors that
// don't retry; they throw immediately (typed FactSheetValidationError for
// 422 so callers can map field-level errors back to RHF setError).

import { useCallback } from 'react'
import { supabase } from './supabase'
import { useFactSheetToken } from './factSheetTokenContext'
import { normalizeForSave } from './normalizeSection'

// ── Error types ─────────────────────────────────────────────────────

export interface ZodFieldError {
  /** Zod issue path, e.g. [] for top-level unrecognized_keys, or
   * ["marriages", 0, "partner"] for nested field-level. */
  path: ReadonlyArray<string | number>
  message: string
  /** Zod issue code, e.g. 'invalid_type' / 'unrecognized_keys' / 'too_small'. */
  code: string
}

/**
 * Thrown when the Edge Function returns 422 + reason:'validation_failed'.
 * Caller (section component) walks `fieldErrors` through zodPathToRhfName
 * + form.setError for per-field display; top-level errors (path:[]) fall
 * back to the status-banner channel.
 */
export class FactSheetValidationError extends Error {
  readonly sectionId: string
  readonly fieldErrors: ZodFieldError[]

  constructor(sectionId: string, fieldErrors: ZodFieldError[]) {
    super(`Validation failed for section "${sectionId}" (${fieldErrors.length} issue${fieldErrors.length === 1 ? '' : 's'})`)
    this.name = 'FactSheetValidationError'
    this.sectionId = sectionId
    this.fieldErrors = fieldErrors
  }
}

// ── Edge Function response shape (mirror of save-fact-sheet/index.ts) ──

interface SaveResponseOk {
  ok: true
  status: 'pending' | 'in_progress' | 'submitted'
  section_id?: string
  submitted_at?: string
  already_submitted?: boolean
}

interface SaveResponseError {
  ok: false
  reason:
    | 'malformed_token'
    | 'token_not_found'
    | 'expired'
    | 'already_submitted'
    | 'unknown_section'
    | 'validation_failed'
    | 'server_error'
    | 'invalid_body'
    | 'method_not_allowed'
  section_id?: string
  errors?: ZodFieldError[]
}

type SaveResponse = SaveResponseOk | SaveResponseError

// ── Core post helper with retry-once on network failure ────────────

async function invokeWithRetry(body: Record<string, unknown>): Promise<SaveResponse> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await supabase.functions.invoke<SaveResponse>('save-fact-sheet', { body })
    if (!error && data) return data
    if (attempt === 0) {
      // Network / invoke failure — silent retry once after a short backoff
      console.warn('[save-fact-sheet] invoke failed (attempt 1), retrying:', error)
      await new Promise((resolve) => setTimeout(resolve, 500))
      continue
    }
    // Second failure — bubble up
    throw new Error(`save-fact-sheet network failure: ${error?.message ?? 'no response'}`)
  }
  // unreachable
  throw new Error('save-fact-sheet retry loop exited unexpectedly')
}

// ── Autosave entrypoint (hook) ─────────────────────────────────────

/**
 * Returns a memoized saveFunction bound to the current FactSheetToken.
 * Each section component calls this hook and passes the result as the
 * `saveFunction` prop of useFactSheetAutosave.
 *
 * On 422 validation_failed: throws FactSheetValidationError with the
 * full fieldErrors array so the section can call form.setError per field.
 * On any other 200+{ok:false} reason or final network failure: throws
 * a plain Error so the autosave hook surfaces status='error' to the
 * banner channel.
 */
export function useSaveFactSheetSection() {
  const token = useFactSheetToken()
  return useCallback(
    async (sectionId: string, data: unknown): Promise<void> => {
      const normalized = normalizeForSave(sectionId, data)
      const response = await invokeWithRetry({ token, section_id: sectionId, responses: normalized })
      if (response.ok) return
      if (response.reason === 'validation_failed' && response.errors) {
        throw new FactSheetValidationError(sectionId, response.errors)
      }
      throw new Error(`save-fact-sheet rejected: ${response.reason}`)
    },
    [token],
  )
}

// ── Submit entrypoint ──────────────────────────────────────────────

export interface SubmitResult {
  alreadySubmitted: boolean
  submittedAt: string | null
}

/**
 * Fires the terminal submit POST. Caller (Abschicken handler in
 * SectionPage) flushes pending autosave first to avoid a race.
 *
 * The Edge Function is idempotent for re-submits — repeated calls on an
 * already-submitted record return ok:true + already_submitted:true with
 * the original submitted_at. Caller can treat both first-submit and
 * re-submit as success and navigate to /submitted either way.
 */
export async function submitFactSheet(token: string): Promise<SubmitResult> {
  const response = await invokeWithRetry({ token, submitted: true })
  if (!response.ok) {
    throw new Error(`submitFactSheet rejected: ${response.reason}`)
  }
  return {
    alreadySubmitted: !!response.already_submitted,
    submittedAt: response.submitted_at ?? null,
  }
}
