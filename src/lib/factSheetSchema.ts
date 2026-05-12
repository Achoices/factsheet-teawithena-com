// Single source of truth for all 12 fact-sheet sections.
// Mirrors Document Definitions v1.3.0 schema embedded in STEP 0.5 of the
// Phase 3 patch prompt. Section 09 bundles marriages + children per
// Decision Log 2026-05-12.
//
// All year-shaped fields are stored as strings rather than numbers so the
// approximate-year convention (`~1925`) works consistently. Subject.birth_year
// (required, exact 4-digit) is also a string for uniform handling.
//
// Schema-type discipline: we deliberately avoid `.optional().default(...)`
// on per-section schemas because Zod then types input ≠ output, which
// conflicts with react-hook-form's Resolver typing. Optional text fields
// use plain `z.string()` (empty string valid). Optional year fields use
// `z.union([z.string().regex(...), z.literal('')])`. `defaultValues` in
// each section's useForm provides the initial empty values.
//
// Error messages are DE-first (v1 audience); EN translation can layer in
// later via Zod's errorMap.

import { z } from 'zod'

// ---- Validation primitives ----
const ERR_REQUIRED = 'Pflichtfeld'
const ERR_YEAR = 'Vier Ziffern, z.B. 1936'
const ERR_YEAR_APPROX = 'Vier Ziffern, z.B. 1936 oder ~1936 für ungefähr'
const ERR_YEAR_RANGE = 'Vier Ziffern, z.B. 1965 oder 1965-1967'
const ERR_MONTH = '1 bis 12'
const ERR_DAY = '1 bis 31'
const ERR_SKETCH_MAX = 'Maximal 1000 Zeichen'

const YEAR_RE = /^\d{4}$/
const YEAR_APPROX_RE = /^~?\d{4}$/
const YEAR_RANGE_RE = /^~?\d{4}(-\d{4})?$/
const MONTH_RE = /^(0?[1-9]|1[0-2])$/
const DAY_RE = /^(0?[1-9]|[12]\d|3[01])$/
const POSITIVE_INT_RE = /^\d+$/

/** Optional year (approximate): empty allowed; if filled, must match ^~?\d{4}$. */
const optionalApproxYear = z.union([
  z.string().regex(YEAR_APPROX_RE, ERR_YEAR_APPROX),
  z.literal(''),
])

/** Optional year-range: empty allowed; if filled, ^~?\d{4}(-\d{4})?$. */
const optionalYearRange = z.union([
  z.string().regex(YEAR_RANGE_RE, ERR_YEAR_RANGE),
  z.literal(''),
])

/** Plain text where empty is acceptable. */
const optionalText = z.string()

// =========================================================================
// Section 01 — Subject
// =========================================================================
export const subjectSchema = z.object({
  full_name: z.string().min(1, ERR_REQUIRED),
  birth_name: optionalText,
  birth_year: z.string().regex(YEAR_RE, ERR_YEAR),
  birth_month: z.union([z.string().regex(MONTH_RE, ERR_MONTH), z.literal('')]),
  birth_day: z.union([z.string().regex(DAY_RE, ERR_DAY), z.literal('')]),
  place_of_birth: z.string().min(1, ERR_REQUIRED),
  nationality: optionalText,
  mother_tongue: optionalText,
  subject_character_sketch: z.string().max(1000, ERR_SKETCH_MAX),
})
export type SubjectFormData = z.infer<typeof subjectSchema>

// =========================================================================
// Section 02 / 03 — Father / Mother (same shape)
// =========================================================================
const parentShape = {
  name: z.string().min(1, ERR_REQUIRED),
  place_of_origin: optionalText,
  birth_year: optionalApproxYear,
  death_year: optionalApproxYear,
  profession: optionalText,
}
export const fatherSchema = z.object(parentShape)
export const motherSchema = z.object(parentShape)
export type FatherFormData = z.infer<typeof fatherSchema>
export type MotherFormData = z.infer<typeof motherSchema>

// =========================================================================
// Family Context (inline between 02 Father and 03 Mother)
// Renamed from parentRelationshipSchema → familyContextSchema in STEP 3.2.
// Stored at biographical_facts.family_context.
// =========================================================================
export const familyContextSchema = z.object({
  most_influential_parent: z.union([
    z.enum(['father', 'mother', 'both', 'neither']),
    z.literal(''),
  ]),
  parent_relationship_note: z.string().max(1000, ERR_SKETCH_MAX),
})
export type FamilyContextFormData = z.infer<typeof familyContextSchema>

// =========================================================================
// Section 04 — Grandparents (4 explicit entries)
// =========================================================================
const grandparentShape = {
  name: optionalText,
  birth_year: optionalApproxYear,
  death_year: optionalApproxYear,
}
const grandparentSchema = z.object(grandparentShape)

export const grandparentsSchema = z.object({
  paternal_grandfather: grandparentSchema,
  paternal_grandmother: grandparentSchema,
  maternal_grandfather: grandparentSchema,
  maternal_grandmother: grandparentSchema,
})
export type GrandparentsFormData = z.infer<typeof grandparentsSchema>

// =========================================================================
// Section 05 — Siblings
// =========================================================================
export const siblingsSchema = z.object({
  count: z.union([z.string().regex(POSITIVE_INT_RE), z.literal('')]),
  names: optionalText,
})
export type SiblingsFormData = z.infer<typeof siblingsSchema>

// =========================================================================
// Section 06 — Education (repeating array)
// =========================================================================
const educationEntrySchema = z.object({
  institution: optionalText,
  field: optionalText,
  start_year: optionalApproxYear,
  end_year: optionalApproxYear,
})
export const educationSchema = z.object({
  entries: z.array(educationEntrySchema),
})
export type EducationFormData = z.infer<typeof educationSchema>

// =========================================================================
// Section 07 — Military
// =========================================================================
export const militarySchema = z.object({
  served: z.boolean(),
  branch: optionalText,
  years: optionalYearRange,
})
export type MilitaryFormData = z.infer<typeof militarySchema>

// =========================================================================
// Section 08 — Career (up to 4 stations)
// =========================================================================
const careerStationSchema = z.object({
  employer: optionalText,
  role: optionalText,
  location: optionalText,
  years: optionalYearRange,
})
export const careerSchema = z.object({
  stations: z.array(careerStationSchema).max(4),
})
export type CareerFormData = z.infer<typeof careerSchema>

// =========================================================================
// Section 09 — Relationships (marriages + children, bundled per Decision Log 2026-05-12)
// =========================================================================
const marriageSchema = z.object({
  partner: optionalText,
  year: optionalApproxYear,
  location: optionalText,
  dissolution_type: z.enum(['ongoing', 'divorced', 'widowed']),
  dissolution_year: optionalApproxYear,
  relationship_type: z.enum(['marriage', 'partnership', 'civil_partnership']),
})
const childSchema = z.object({
  name: optionalText,
  birth_year: optionalApproxYear,
})
export const relationshipsSchema = z.object({
  marriages: z.array(marriageSchema).max(3),
  children: z.array(childSchema).max(5),
})
export type RelationshipsFormData = z.infer<typeof relationshipsSchema>

// =========================================================================
// Section 10 — Residences (repeating array)
// =========================================================================
const residenceEntrySchema = z.object({
  city: optionalText,
  country: optionalText,
  start_year: optionalApproxYear,
  end_year: optionalApproxYear,
})
export const residencesSchema = z.object({
  entries: z.array(residenceEntrySchema),
})
export type ResidencesFormData = z.infer<typeof residencesSchema>

// =========================================================================
// Section 11 — Memory Anchors
// =========================================================================
export const anchorsSchema = z.object({
  first_car_make_model: optionalText,
  lifelong_passion: optionalText,
  major_trip: optionalText,
  special_possessions: optionalText,
})
export type AnchorsFormData = z.infer<typeof anchorsSchema>

// =========================================================================
// Section 12 — Health
// =========================================================================
export const healthSchema = z.object({
  pacing: z.union([
    z.enum(['full_pace', 'moderate', 'slow_with_breaks']),
    z.literal(''),
  ]),
  cognitive_adaptations: z.array(
    z.enum([
      'short_sentences',
      'repeat_key_points',
      'visual_aids',
      'written_summaries',
      'extra_time',
    ]),
  ),
  max_session_minutes: z.union([z.string().regex(/^\d{1,3}$/), z.literal('')]),
  health_notes: optionalText,
})
export type HealthFormData = z.infer<typeof healthSchema>

// =========================================================================
// Combined biographicalFacts shape (whole-row reference; not used by any
// single form — each section uses its own per-section schema instead).
// Sections are `.optional()` here so a partially-filled record validates.
// =========================================================================
export const biographicalFactsSchema = z.object({
  subject: subjectSchema.optional(),
  father: fatherSchema.optional(),
  family_context: familyContextSchema.optional(),
  mother: motherSchema.optional(),
  grandparents: grandparentsSchema.optional(),
  siblings: siblingsSchema.optional(),
  education: educationSchema.optional(),
  military: militarySchema.optional(),
  career: careerSchema.optional(),
  relationships: relationshipsSchema.optional(),
  residences: residencesSchema.optional(),
  anchors: anchorsSchema.optional(),
  health: healthSchema.optional(),
})
export type BiographicalFacts = z.infer<typeof biographicalFactsSchema>
