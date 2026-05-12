// Single source of truth for the 12 fact-sheet sections.
// Order matches Document Definitions v1.3.0 (operator-platform fact-sheet UI parallel).
// Section 09 bundles marriages + children under id 'relationships' per Decision Log 2026-05-12.

export const SECTION_IDS = [
  'subject',
  'father',
  'mother',
  'grandparents',
  'siblings',
  'education',
  'military',
  'career',
  'relationships',
  'residences',
  'anchors',
  'health',
] as const

export type SectionId = typeof SECTION_IDS[number]

export function isSectionId(value: string | undefined | null): value is SectionId {
  return !!value && (SECTION_IDS as readonly string[]).includes(value)
}

export function nextSectionId(current: SectionId): SectionId | null {
  const i = SECTION_IDS.indexOf(current)
  return i >= 0 && i < SECTION_IDS.length - 1 ? SECTION_IDS[i + 1] : null
}

export function prevSectionId(current: SectionId): SectionId | null {
  const i = SECTION_IDS.indexOf(current)
  return i > 0 ? SECTION_IDS[i - 1] : null
}

export function sectionIndex(current: SectionId): number {
  return SECTION_IDS.indexOf(current)
}
