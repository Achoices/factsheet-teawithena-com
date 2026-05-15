// Phase B (Step 6 D-EF3 lock 2026-05-15): mirror of SectionValidationContext
// for autosave drain. The currently-mounted section's useFactSheetAutosave
// hook registers its flush() function here; SectionPage's Abschicken
// handler runs it before firing the terminal submit POST, ensuring no
// pending debounced autosave races the submit.
//
// flush() cancels the pending debounce timer and immediately fires
// saveFunction(sectionId, latest-data). Safe to call even when no save is
// pending — it just produces a redundant (but harmless) save.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'

type FlushFn = () => Promise<void>

interface AutosaveFlushContextValue {
  setFlush: (fn: FlushFn | null) => void
  runFlush: () => Promise<void>
}

const AutosaveFlushContext = createContext<AutosaveFlushContextValue | null>(null)

export function AutosaveFlushProvider({ children }: { children: ReactNode }) {
  const flushRef = useRef<FlushFn | null>(null)

  const setFlush = useCallback((fn: FlushFn | null) => {
    flushRef.current = fn
  }, [])

  const runFlush = useCallback(async () => {
    const fn = flushRef.current
    if (!fn) return
    try {
      await fn()
    } catch (err) {
      // Flush errors are logged but don't block submit — the submit POST
      // may still succeed (data is just the most recent server state,
      // not the local-but-failed-to-save edit).
      console.warn('[autosaveFlush] flush threw, continuing to submit:', err)
    }
  }, [])

  const value = useMemo(() => ({ setFlush, runFlush }), [setFlush, runFlush])

  return (
    <AutosaveFlushContext.Provider value={value}>
      {children}
    </AutosaveFlushContext.Provider>
  )
}

/** useFactSheetAutosave calls this to register its flush; clears on unmount. */
export function useRegisterAutosaveFlush(flush: FlushFn) {
  const ctx = useContext(AutosaveFlushContext)
  if (!ctx) {
    throw new Error('useRegisterAutosaveFlush must be used inside <AutosaveFlushProvider>')
  }
  useEffect(() => {
    ctx.setFlush(flush)
    return () => ctx.setFlush(null)
  }, [ctx, flush])
}

/** SectionPage's Abschicken handler reads this to drain pending autosave pre-submit. */
export function useRunAutosaveFlush() {
  const ctx = useContext(AutosaveFlushContext)
  if (!ctx) {
    throw new Error('useRunAutosaveFlush must be used inside <AutosaveFlushProvider>')
  }
  return ctx.runFlush
}
