// Single autosave entrypoint for every section.
// STEP 3.1: stub that console.logs the payload + sleeps 500ms + resolves success.
// STEP 4 will replace this function body with the real Edge Function call
//   (POST /functions/v1/save-fact-sheet with magic-link token in Authorization header).
// Per the STEP 3.1 spec: per-section code does NOT rewrite when STEP 4 lands.

/**
 * Persist a single section's data to the backend.
 *
 * @param sectionId — one of the 12 section ids (see src/lib/sections.ts)
 * @param data — the validated section payload (already passed Zod)
 * @returns Promise<void>; rejects on failure (autosave hook surfaces 'error' state)
 */
export async function saveFactSheetSection(sectionId: string, data: unknown): Promise<void> {
  console.log('[autosave stub]', sectionId, data)
  await new Promise<void>((resolve) => setTimeout(resolve, 500))
  // STEP 4 replaces this body with:
  //   const { error } = await supabase.functions.invoke('save-fact-sheet', {
  //     body: { section_id: sectionId, responses: data },
  //     headers: { Authorization: `Bearer ${magicLinkToken}` },
  //   })
  //   if (error) throw error
}
