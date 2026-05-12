// Single autosave entrypoint for every section.
//
// PERSISTENCE BOUNDARY (Step 5a):
// Form state is string-shaped per factSheetSchema.ts (Zod regex validation
// on plain strings; no .transform()). Persistence shape — YearField{value,approximate}
// for single years, YearRange{start,end} for year ranges, plus derived ISO
// date_of_birth — is produced by normalizeSection.ts and applied here, before
// the payload is logged / sent. This keeps RHF's Resolver<TFieldValues> typing
// clean (input type === output type at the form layer) while still emitting
// canonical CANONICAL-MAPPING-v1.0 shapes to the backend, matching
// operator-platform's Step 4 save path.
//
// STEP 3.1: stub that console.logs the payload + sleeps 500ms + resolves success.
// STEP 5a (this commit): pipe form payload through normalizeForSave first.
// STEP 6 will replace the body with the real Edge Function call
//   (POST /functions/v1/save-fact-sheet with magic-link token in Authorization header).
// Per the STEP 3.1 spec: per-section code does NOT rewrite when STEP 6 lands.

import { normalizeForSave } from './normalizeSection'

/**
 * Persist a single section's data to the backend.
 *
 * @param sectionId — one of the 12 section ids (see src/lib/sections.ts)
 * @param data — the validated section payload (already passed Zod) in form-state shape
 * @returns Promise<void>; rejects on failure (autosave hook surfaces 'error' state)
 */
export async function saveFactSheetSection(sectionId: string, data: unknown): Promise<void> {
  const normalized = normalizeForSave(sectionId, data)
  console.log('[autosave stub]', sectionId, normalized)
  await new Promise<void>((resolve) => setTimeout(resolve, 500))
  // STEP 6 replaces this body with:
  //   const { error } = await supabase.functions.invoke('save-fact-sheet', {
  //     body: { section_id: sectionId, responses: normalized },
  //     headers: { Authorization: `Bearer ${magicLinkToken}` },
  //   })
  //   if (error) throw error
}
