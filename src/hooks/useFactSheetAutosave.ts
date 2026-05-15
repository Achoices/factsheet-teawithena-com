import { useCallback, useEffect, useRef } from 'react'
import { useAutosaveStatus } from '../lib/autosaveStatusContext'
import { useRegisterAutosaveFlush } from '../lib/autosaveFlushContext'
import { FactSheetValidationError, type ZodFieldError } from '../lib/factSheetSave'

interface UseFactSheetAutosaveOptions<T> {
  sectionId: string
  data: T
  saveFunction: (sectionId: string, data: T) => Promise<void>
  /** Debounce window in ms. Default 800. */
  debounceMs?: number
  /**
   * Phase B: called when save returns 422 + reason:'validation_failed'.
   * Section components map errors → form.setError per field via
   * zodPathToRhfName. If omitted, validation failures degrade to the
   * status='error' banner.
   */
  onValidationError?: (errors: ZodFieldError[], sectionId: string) => void
}

export interface UseFactSheetAutosaveResult {
  /**
   * Cancel the pending debounce timer (if any) and fire saveFunction
   * immediately with the latest data. Returns a promise that resolves
   * once the save is done (or rejected — caller decides whether to
   * abort downstream actions). Used by SectionPage's Abschicken handler
   * to drain pending autosave before the terminal submit POST.
   *
   * Safe to call when no save is pending — produces a redundant write.
   */
  flush: () => Promise<void>
}

/**
 * Debounced autosave for a section. Watches `data` (compared via JSON
 * stringify so reference-only changes don't fire), waits `debounceMs` after
 * the last edit, then calls `saveFunction(sectionId, data)`.
 *
 * Last-write-wins: a new edit while a debounced call is pending cancels the
 * pending call and starts a fresh one. If a save is mid-flight when a new
 * edit arrives, the new edit waits its debounce window — we don't kill the
 * in-flight request because that's the most likely to commit usefully.
 *
 * The hook pushes status into AutosaveStatusContext so the SectionPage
 * chrome can render the "Speichern…" indicator. The hook itself returns
 * a flush() function (used by Abschicken to drain pre-submit).
 *
 * Initial-render guard: skips the first effect run so a just-mounted form
 * with default-empty values doesn't fire an autosave immediately.
 *
 * PERSISTENCE SHAPE: the `data` passed here is the live RHF watch() output —
 * string-shaped per the section's Zod schema (no .transform()). The boundary
 * conversion to canonical YearField/YearRange/ISO-date shapes happens inside
 * `saveFunction` (saveFactSheetSection → normalizeForSave). The hook itself
 * is shape-agnostic.
 *
 * ERROR FLOW (Phase B):
 *  - FactSheetValidationError (422) → calls onValidationError (if provided)
 *    AND sets status='error' so the banner appears as a secondary signal.
 *  - Any other Error (network failure after retry, business-logic
 *    {ok:false}) → sets status='error' only.
 */
export function useFactSheetAutosave<T>({
  sectionId,
  data,
  saveFunction,
  debounceMs = 800,
  onValidationError,
}: UseFactSheetAutosaveOptions<T>): UseFactSheetAutosaveResult {
  const { setStatus, setLastSavedAt } = useAutosaveStatus()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialMountRef = useRef(true)

  // Refs so flush() can read the latest values without re-creating itself
  // on every render (the hook is consumed inside an effect-deps list).
  const dataRef = useRef(data)
  dataRef.current = data
  const saveFunctionRef = useRef(saveFunction)
  saveFunctionRef.current = saveFunction
  const onValidationErrorRef = useRef(onValidationError)
  onValidationErrorRef.current = onValidationError

  // Single fire path used by both the debounced effect and the flush method.
  const runSave = useCallback(async () => {
    setStatus('saving')
    try {
      await saveFunctionRef.current(sectionId, dataRef.current)
      setStatus('saved')
      setLastSavedAt(new Date())
    } catch (err) {
      if (err instanceof FactSheetValidationError && onValidationErrorRef.current) {
        onValidationErrorRef.current(err.fieldErrors, err.sectionId)
      } else {
        console.error('[useFactSheetAutosave] save failed:', err)
      }
      setStatus('error')
    }
  }, [sectionId, setStatus, setLastSavedAt])

  // JSON.stringify so the effect re-fires on content change, not on reference change
  // (react-hook-form's watch() returns a fresh object on every keystroke).
  const dataKey = JSON.stringify(data)

  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      runSave()
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey])

  // flush(): cancel pending debounce + fire immediately. Stable identity so
  // useRegisterAutosaveFlush doesn't re-register on every render.
  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    await runSave()
  }, [runSave])

  useRegisterAutosaveFlush(flush)

  return { flush }
}
