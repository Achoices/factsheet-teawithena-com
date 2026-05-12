import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type ValidationReason =
  | 'malformed_token'
  | 'token_not_found'
  | 'expired'
  | 'already_submitted'
  | 'server_error'

export interface ValidationResult {
  valid: boolean
  reason?: ValidationReason
  interview?: {
    interview_code: string
    interviewee_first_name: string
    language: 'de' | 'en'
  }
  submitted_at?: string
}

export function useTokenValidation(token: string | null) {
  return useQuery<ValidationResult>({
    queryKey: ['validate-token', token],
    queryFn: async () => {
      if (!token) return { valid: false, reason: 'malformed_token' as const }
      const { data, error } = await supabase.functions.invoke<ValidationResult>(
        'validate-fact-sheet-token',
        { body: { token } },
      )
      if (error) {
        console.error('validate-fact-sheet-token invoke error:', error)
        return { valid: false, reason: 'server_error' as const }
      }
      // supabase.functions.invoke parses the JSON for us; data is already typed.
      return data ?? { valid: false, reason: 'server_error' as const }
    },
    enabled: !!token,
    // Phase 3: relaxed from Infinity to 5 min so operator-side status changes
    // (token expiry, force-submit) propagate within a session window.
    // BACKLOG-FACTSHEET-001 trade-off documented: longer windows = better UX,
    // shorter = faster propagation. 5 min is the chosen middle ground.
    staleTime: 5 * 60 * 1000,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
