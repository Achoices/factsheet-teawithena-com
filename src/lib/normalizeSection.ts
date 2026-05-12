// Boundary layer between form state (string-typed, see factSheetSchema.ts)
// and persistence shape (YearField/YearRange + derived ISO dates, see
// factSheetTypes.ts). Each per-section normalize* function takes the raw
// form payload and returns the canonical-shape payload. normalizeForSave()
// dispatches by sectionId.
//
// Rationale (Step 5a decision): Zod 4 .transform() would not reach this code
// path because the autosave path uses form.watch() (RHF input type), not
// handleSubmit. Doing the transform here keeps schemas pure validators and
// concentrates conversion in one auditable file. Mirrors operator-platform's
// Step 4 saveFacts pattern (toYearField/toYearRange applied inside saveFacts).
//
// Sections out of 5b scope (anchors, health) pass through unchanged —
// they'll fold in during Step 5c once their UI ships. family_context has
// no year fields, so it also passes through.

import {
  type SubjectFormData,
  type FatherFormData,
  type MotherFormData,
  type GrandparentsFormData,
  type EducationFormData,
  type MilitaryFormData,
  type CareerFormData,
  type SiblingsFormData,
  type RelationshipsFormData,
  type ResidencesFormData,
} from './factSheetSchema'
import {
  type NormalizedSubject,
  type NormalizedParent,
  type NormalizedGrandparent,
  type NormalizedGrandparents,
  type NormalizedEducation,
  type NormalizedMilitary,
  type NormalizedCareer,
  type NormalizedSiblings,
  type NormalizedRelationships,
  type NormalizedMarriage,
  type NormalizedChild,
  type NormalizedResidences,
  EMPTY_YEAR_FIELD,
} from './factSheetTypes'
import { parseYearField, parseYearRange } from './yearFieldHelpers'

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function parseIntOrNull(input: string): number | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null
  const n = parseInt(trimmed, 10)
  return Number.isFinite(n) ? n : null
}

/** ISO YYYY-MM-DD when all three components are non-null; else null. */
function deriveDateOfBirth(year: number | null, month: number | null, day: number | null): string | null {
  if (year === null || month === null || day === null) return null
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

// ─────────────────────────────────────────────────────────────────────────
// Per-section normalizers
// ─────────────────────────────────────────────────────────────────────────

export function normalizeSubject(data: SubjectFormData): NormalizedSubject {
  const birth_year = parseYearField(data.birth_year)
  const birth_month = parseIntOrNull(data.birth_month)
  const birth_day = parseIntOrNull(data.birth_day)
  return {
    full_name: data.full_name,
    birth_name: data.birth_name,
    birth_year,
    birth_month,
    birth_day,
    date_of_birth: deriveDateOfBirth(birth_year.value, birth_month, birth_day),
    place_of_birth: data.place_of_birth,
    nationality: data.nationality,
    mother_tongue: data.mother_tongue,
    subject_character_sketch: data.subject_character_sketch,
  }
}

function normalizeParent(data: FatherFormData | MotherFormData): NormalizedParent {
  return {
    name: data.name,
    place_of_origin: data.place_of_origin,
    birth_year: parseYearField(data.birth_year),
    death_year: parseYearField(data.death_year),
    profession: data.profession,
  }
}

export function normalizeFather(data: FatherFormData): NormalizedParent {
  return normalizeParent(data)
}

export function normalizeMother(data: MotherFormData): NormalizedParent {
  return normalizeParent(data)
}

function normalizeGrandparent(g: GrandparentsFormData['paternal_grandfather']): NormalizedGrandparent {
  return {
    name: g.name,
    birth_year: parseYearField(g.birth_year),
    death_year: parseYearField(g.death_year),
  }
}

export function normalizeGrandparents(data: GrandparentsFormData): NormalizedGrandparents {
  return {
    paternal_grandfather: normalizeGrandparent(data.paternal_grandfather),
    paternal_grandmother: normalizeGrandparent(data.paternal_grandmother),
    maternal_grandfather: normalizeGrandparent(data.maternal_grandfather),
    maternal_grandmother: normalizeGrandparent(data.maternal_grandmother),
  }
}

export function normalizeEducation(data: EducationFormData): NormalizedEducation {
  return {
    entries: data.entries.map((e) => ({
      institution: e.institution,
      field: e.field,
      start_year: parseYearField(e.start_year),
      end_year: parseYearField(e.end_year),
    })),
  }
}

export function normalizeMilitary(data: MilitaryFormData): NormalizedMilitary {
  return {
    served: data.served,
    branch: data.branch,
    years: parseYearRange(data.years),
  }
}

export function normalizeCareer(data: CareerFormData): NormalizedCareer {
  return {
    stations: data.stations.map((s) => ({
      employer: s.employer,
      role: s.role,
      location: s.location,
      years: parseYearRange(s.years),
    })),
  }
}

export function normalizeSiblings(data: SiblingsFormData): NormalizedSiblings {
  return {
    count: parseIntOrNull(data.count),
    names: data.names,
  }
}

// SEMANTIC RULE for dissolution_year (Step 5b drift #4 resolution):
//   ALWAYS emit the key (canonical contract: payload shape is stable).
//   When dissolution_type === 'ongoing', force value to EMPTY_YEAR_FIELD
//   regardless of what the form state holds — semantic truth (ongoing ⇒ no
//   dissolution) overrides whatever the user typed before toggling. The form
//   keeps the user's input in state (RHF default shouldUnregister:false) so
//   flipping back to divorced/widowed restores their value in the UI; this
//   only affects what hits the persisted payload.
//
//   This rule must mirror on operator-platform's phase-4.2 fix — operator's
//   saveFacts should apply the same null-when-ongoing logic for canonical
//   consistency across both writers.
function normalizeMarriage(m: RelationshipsFormData['marriages'][number]): NormalizedMarriage {
  const dissolutionYear =
    m.dissolution_type === 'ongoing'
      ? { ...EMPTY_YEAR_FIELD }
      : parseYearField(m.dissolution_year)
  return {
    partner: m.partner,
    year: parseYearField(m.year),
    location: m.location,
    relationship_type: m.relationship_type,
    dissolution_type: m.dissolution_type,
    dissolution_year: dissolutionYear,
  }
}

function normalizeChild(c: RelationshipsFormData['children'][number]): NormalizedChild {
  return {
    name: c.name,
    birth_year: parseYearField(c.birth_year),
  }
}

export function normalizeRelationships(data: RelationshipsFormData): NormalizedRelationships {
  return {
    marriages: data.marriages.map(normalizeMarriage),
    children: data.children.map(normalizeChild),
  }
}

export function normalizeResidences(data: ResidencesFormData): NormalizedResidences {
  return {
    entries: data.entries.map((e) => ({
      city: e.city,
      country: e.country,
      start_year: parseYearField(e.start_year),
      end_year: parseYearField(e.end_year),
    })),
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Dispatcher
// ─────────────────────────────────────────────────────────────────────────

/**
 * Convert section form state (string-typed) into canonical persistence shape
 * (YearField/YearRange + derived ISO dates, integer-typed counts). Called by
 * saveFactSheetSection before the payload is logged / posted.
 *
 * Returns `unknown` so callers don't have to know the per-section output
 * type — the Edge Function (Step 6) treats it as opaque JSONB anyway.
 *
 * Sections without year/coercion needs pass through unchanged.
 */
export function normalizeForSave(sectionId: string, data: unknown): unknown {
  switch (sectionId) {
    case 'subject':
      return normalizeSubject(data as SubjectFormData)
    case 'father':
      return normalizeFather(data as FatherFormData)
    case 'mother':
      return normalizeMother(data as MotherFormData)
    case 'grandparents':
      return normalizeGrandparents(data as GrandparentsFormData)
    case 'education':
      return normalizeEducation(data as EducationFormData)
    case 'military':
      return normalizeMilitary(data as MilitaryFormData)
    case 'career':
      return normalizeCareer(data as CareerFormData)
    case 'siblings':
      return normalizeSiblings(data as SiblingsFormData)
    case 'relationships':
      return normalizeRelationships(data as RelationshipsFormData)
    case 'residences':
      return normalizeResidences(data as ResidencesFormData)
    // Pass-through: no year fields, or section UI not yet shipped (5c folds these in):
    //   family_context, anchors, health
    default:
      return data
  }
}
