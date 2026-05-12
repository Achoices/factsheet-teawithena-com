// Canonical persistence-shape types per CANONICAL-MAPPING-v1.0.
// These describe the post-normalize payload that saveFactSheetSection logs
// (and, at Step 6, posts to the save-fact-sheet Edge Function). They are NOT
// the form-state shape — form state stays string-typed per factSheetSchema.ts
// to keep RHF Resolver<TFieldValues> typing clean. Conversion happens in
// normalizeSection.ts at the I/O boundary.
//
// Always emit explicit-empty YearRange ({start:{value:null,approximate:false},
// end:null}) — never plain null — per Step 4 drift #3 resolution. This matches
// operator-platform's emptyYR() helper for canonical consistency.

export type YearField = {
  value: number | null
  approximate: boolean
}

export type YearRange = {
  start: YearField
  end: YearField | null
}

export const EMPTY_YEAR_FIELD: YearField = { value: null, approximate: false }
export const EMPTY_YEAR_RANGE: YearRange = { start: EMPTY_YEAR_FIELD, end: null }

// ─────────────────────────────────────────────────────────────────────────
// Per-section normalized payload shapes (Step 5a scope: 8 shipped sections).
// Sections not yet shipped (relationships, residences, anchors, health) fold
// in at Step 5b. family_context has no year fields and passes through.
// ─────────────────────────────────────────────────────────────────────────

export interface NormalizedSubject {
  full_name: string
  birth_name: string
  birth_year: YearField
  birth_month: number | null
  birth_day: number | null
  /** ISO YYYY-MM-DD when year.value + month + day all non-null; else null. */
  date_of_birth: string | null
  place_of_birth: string
  nationality: string
  mother_tongue: string
  subject_character_sketch: string
}

export interface NormalizedParent {
  name: string
  place_of_origin: string
  birth_year: YearField
  death_year: YearField
  profession: string
}

export interface NormalizedGrandparent {
  name: string
  birth_year: YearField
  death_year: YearField
}

export interface NormalizedGrandparents {
  paternal_grandfather: NormalizedGrandparent
  paternal_grandmother: NormalizedGrandparent
  maternal_grandfather: NormalizedGrandparent
  maternal_grandmother: NormalizedGrandparent
}

export interface NormalizedEducationEntry {
  institution: string
  field: string
  start_year: YearField
  end_year: YearField
}

export interface NormalizedEducation {
  entries: NormalizedEducationEntry[]
}

export interface NormalizedMilitary {
  served: boolean
  branch: string
  years: YearRange
}

export interface NormalizedCareerStation {
  employer: string
  role: string
  /** Operator-platform stores as `city`; factsheet UI label is `Ort`/`location`.
   * Step 6 Edge Function will rename to `city` when posting. Field stays
   * `location` here so it matches the form-state key 1:1. */
  location: string
  years: YearRange
}

export interface NormalizedCareer {
  stations: NormalizedCareerStation[]
}

export interface NormalizedSiblings {
  count: number | null
  names: string
}

// ─────────────────────────────────────────────────────────────────────────
// Section 09 — Relationships (added 5b)
// ─────────────────────────────────────────────────────────────────────────

export type RelationshipType = 'marriage' | 'partnership' | 'civil_partnership'
export type DissolutionType = 'ongoing' | 'divorced' | 'widowed'

export interface NormalizedMarriage {
  partner: string
  /** YearField — present even when value is null (always-emit canonical contract). */
  year: YearField
  location: string
  relationship_type: RelationshipType
  dissolution_type: DissolutionType
  /** ALWAYS PRESENT in payload. When dissolution_type === 'ongoing', normalize
   * forces this to {value:null,approximate:false} regardless of form state —
   * semantic truth (ongoing ⇒ no dissolution year) wins over user input. */
  dissolution_year: YearField
}

export interface NormalizedChild {
  name: string
  birth_year: YearField
}

export interface NormalizedRelationships {
  marriages: NormalizedMarriage[]
  children: NormalizedChild[]
}

// ─────────────────────────────────────────────────────────────────────────
// Section 10 — Residences (added 5b)
// ─────────────────────────────────────────────────────────────────────────

export interface NormalizedResidenceEntry {
  city: string
  country: string
  start_year: YearField
  end_year: YearField
}

export interface NormalizedResidences {
  entries: NormalizedResidenceEntry[]
}
