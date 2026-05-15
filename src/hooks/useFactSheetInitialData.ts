// Load-path hook (Step 6 follow-up 2026-05-15). Reads the cached validate
// query (no extra network round-trip), pulls the requested section's
// slice from biographical_facts, and runs the caller-provided
// denormalizer to produce form-state defaultValues.
//
// Falls back to the section's EMPTY constant when:
//   - The cache has no validate result yet (form mount races validation —
//     shouldn't happen because SectionPage gates rendering on validate
//     success, but defensive)
//   - The interview row has no biographical_facts (never saved)
//   - The section key is absent from biographical_facts (section never
//     saved on this record)
//
// Stable identity: useMemo over the cached snapshot. Each section calls
// useForm({ defaultValues: <returned value> }) on mount; useForm reads
// defaultValues once at construction so the form's initial state reflects
// what's on disk. Subsequent autosaves of other sections that mutate the
// validate cache do NOT re-trigger this form's defaultValues — RHF is
// uncontrolled by design. That's correct: the current form is the source
// of truth for its own section while mounted.

import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useFactSheetToken } from '../lib/factSheetTokenContext'
import type { ValidationResult } from './useTokenValidation'

export function useFactSheetInitialData<TFormData>(
  sectionId: string,
  denormalize: (raw: unknown) => TFormData,
  fallback: TFormData,
): TFormData {
  const token = useFactSheetToken()
  const queryClient = useQueryClient()

  return useMemo(() => {
    const cached = queryClient.getQueryData<ValidationResult>(['validate-token', token])
    const facts = cached?.interview?.biographical_facts
    if (!facts || typeof facts !== 'object') return fallback
    const sectionSlice = (facts as Record<string, unknown>)[sectionId]
    if (sectionSlice === undefined || sectionSlice === null) return fallback
    return denormalize(sectionSlice)
    // sectionId, token, denormalize, fallback are stable per section mount;
    // we intentionally don't depend on cache freshness — RHF only consumes
    // defaultValues once anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sectionId])
}
