// Phase B: token-threading context (D-FS3 locked decision 2026-05-15).
// SectionPage validates the magic-link token via useTokenValidation, then
// mounts FactSheetTokenProvider so every descendant (section components,
// useSaveFactSheetSection hook, Abschicken handler) can read the token
// without prop-drilling. Hook throws if used outside the provider — the
// provider is mounted in exactly one place (SectionPageBody) and only
// after the token has cleared validation.

import { createContext, useContext, type ReactNode } from 'react'

const FactSheetTokenContext = createContext<string | null>(null)

export function FactSheetTokenProvider({
  token,
  children,
}: {
  token: string
  children: ReactNode
}) {
  return (
    <FactSheetTokenContext.Provider value={token}>
      {children}
    </FactSheetTokenContext.Provider>
  )
}

export function useFactSheetToken(): string {
  const token = useContext(FactSheetTokenContext)
  if (!token) {
    throw new Error(
      'useFactSheetToken called outside FactSheetTokenProvider. The provider is mounted by SectionPage after token validation succeeds.',
    )
  }
  return token
}
