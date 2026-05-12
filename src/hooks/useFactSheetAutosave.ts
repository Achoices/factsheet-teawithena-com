import { useEffect, useRef } from 'react'
import { useAutosaveStatus } from '../lib/autosaveStatusContext'

interface UseFactSheetAutosaveOptions<T> {
  sectionId: string
  data: T
  saveFunction: (sectionId: string, data: T) => Promise<void>
  /** Debounce window in ms. Default 800. */
  debounceMs?: number
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
 * nothing — status is read via useAutosaveStatus().
 *
 * Initial-render guard: skips the first effect run so a just-mounted form
 * with default-empty values doesn't fire an autosave immediately.
 */
export function useFactSheetAutosave<T>({
  sectionId,
  data,
  saveFunction,
  debounceMs = 800,
}: UseFactSheetAutosaveOptions<T>): void {
  const { setStatus, setLastSavedAt } = useAutosaveStatus()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialMountRef = useRef(true)

  // JSON.stringify so the effect re-fires on content change, not on reference change
  // (react-hook-form's watch() returns a fresh object on every keystroke).
  const dataKey = JSON.stringify(data)

  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setStatus('saving')
      try {
        await saveFunction(sectionId, data)
        setStatus('saved')
        setLastSavedAt(new Date())
      } catch (err) {
        console.error('[useFactSheetAutosave] save failed:', err)
        setStatus('error')
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey])
}
