import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'

type SectionValidator = () => Promise<boolean>

interface SectionValidationContextValue {
  /** Section calls this on mount to register its validate() fn; null clears. */
  setValidator: (fn: SectionValidator | null) => void
  /** SectionPage's "Speichern und weiter" awaits this before navigating. */
  runValidation: () => Promise<boolean>
}

const SectionValidationContext = createContext<SectionValidationContextValue | null>(null)

/**
 * Holds a single validator function ref that the currently-rendered section
 * registers via useSetSectionValidator. SectionPage's next-button awaits
 * runValidation() before navigating. Default behaviour (no validator
 * registered) = true, so sections without a form (the still-placeholder ones)
 * navigate unimpeded.
 *
 * Why ref-based: validators capture form state via closure. Stashing the
 * latest validator in a ref avoids stale closures + lets us re-register on
 * every render without bloating context dispatch traffic.
 */
export function SectionValidationProvider({ children }: { children: ReactNode }) {
  const validatorRef = useRef<SectionValidator | null>(null)

  const setValidator = useCallback((fn: SectionValidator | null) => {
    validatorRef.current = fn
  }, [])

  const runValidation = useCallback(async () => {
    const fn = validatorRef.current
    if (!fn) return true
    try {
      return await fn()
    } catch (err) {
      console.error('[sectionValidation] validator threw:', err)
      return false
    }
  }, [])

  const value = useMemo(() => ({ setValidator, runValidation }), [setValidator, runValidation])

  return (
    <SectionValidationContext.Provider value={value}>
      {children}
    </SectionValidationContext.Provider>
  )
}

/** Section components call this with their own validate() fn. */
export function useSetSectionValidator(validate: SectionValidator) {
  const ctx = useContext(SectionValidationContext)
  if (!ctx) {
    throw new Error('useSetSectionValidator must be used inside <SectionValidationProvider>')
  }
  // Register on mount, clear on unmount, re-register if validate identity changes
  // (it usually shouldn't — section components stabilize their callback via useCallback).
  useEffect(() => {
    ctx.setValidator(validate)
    return () => ctx.setValidator(null)
  }, [ctx, validate])
}

/** SectionPage chrome reads this to gate navigation. */
export function useRunSectionValidation() {
  const ctx = useContext(SectionValidationContext)
  if (!ctx) {
    throw new Error('useRunSectionValidation must be used inside <SectionValidationProvider>')
  }
  return ctx.runValidation
}
