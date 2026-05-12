import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface AutosaveStatusContextValue {
  status: AutosaveStatus
  lastSavedAt: Date | null
  setStatus: (s: AutosaveStatus) => void
  setLastSavedAt: (d: Date | null) => void
}

const AutosaveStatusContext = createContext<AutosaveStatusContextValue | null>(null)

interface AutosaveStatusProviderProps {
  children: ReactNode
}

/**
 * Bridges autosave state from the section component (which owns the form) up
 * to the SectionPage chrome (which renders the status indicator near the
 * progress text). Without this lift, the form would have to render its own
 * indicator inline — STEP 3.1 spec puts it in the top-right of the chrome.
 *
 * useFactSheetAutosave reads + writes through this context. SectionPage's
 * status indicator reads via useAutosaveStatus().
 */
export function AutosaveStatusProvider({ children }: AutosaveStatusProviderProps) {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const value = useMemo(
    () => ({ status, lastSavedAt, setStatus, setLastSavedAt }),
    [status, lastSavedAt],
  )
  return (
    <AutosaveStatusContext.Provider value={value}>
      {children}
    </AutosaveStatusContext.Provider>
  )
}

export function useAutosaveStatus(): AutosaveStatusContextValue {
  const ctx = useContext(AutosaveStatusContext)
  if (!ctx) {
    throw new Error(
      'useAutosaveStatus must be used inside an <AutosaveStatusProvider>. ' +
      'SectionPage wraps its content in one; section components and the autosave hook ' +
      'both read/write through it.',
    )
  }
  return ctx
}
