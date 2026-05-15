// Inverse of normalizeSection.ts — converts canonical persistence shape
// (YearField / YearRange / int counts / ISO date_of_birth) back into the
// string-typed form-state shape that section components mount with.
//
// LOAD PATH (Step 6 follow-up 2026-05-15): validate-fact-sheet-token v2
// returns biographical_facts in its response. SectionPage caches via
// TanStack Query; useFactSheetInitialData reads from cache and calls a
// per-section denormalize* function here to build defaultValues for
// each RHF useForm() invocation.
//
// Tolerance contract:
//  - Missing section (key absent on biographical_facts): return EMPTY.
//  - Section present with partial / unexpected shape: defensive — every
//    field reads via optional chain + fallback to the empty form-state
//    string ('', '0', empty array, etc.). Bad data never crashes the
//    form; it just degrades to empty.
//  - YearField {value:null,...}: formatYearField returns ''.
//  - YearRange explicit-empty: formatYearRange returns ''.
//  - Operator-legacy enum values that the canonical filter (D6) didn't
//    catch on save: passed through to form state, where the section's
//    Zod schema may flag them on next blur. Not a load-path concern.

import { formatYearField, formatYearRange } from './yearFieldHelpers'
import type {
  SubjectFormData,
  FatherFormData,
  MotherFormData,
  FamilyContextFormData,
  GrandparentsFormData,
  SiblingsFormData,
  EducationFormData,
  MilitaryFormData,
  CareerFormData,
  RelationshipsFormData,
  ResidencesFormData,
  AnchorsFormData,
  HealthFormData,
} from './factSheetSchema'

// ── helpers ────────────────────────────────────────────────────────

function intToString(v: unknown): string {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return ''
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function asBoolean(v: unknown): boolean {
  return v === true
}

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function yfToString(v: unknown): string {
  // Tolerates the canonical YearField shape OR a bare int (operator-legacy
  // pre-Step 4 records). formatYearField handles only the object shape;
  // for bare numbers we coerce directly.
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : ''
  if (v && typeof v === 'object' && 'value' in v) {
    return formatYearField(v as { value: number | null; approximate: boolean })
  }
  if (typeof v === 'string') return v // legacy string-typed years
  return ''
}

function yrToString(v: unknown): string {
  if (v && typeof v === 'object' && 'start' in v) {
    return formatYearRange(v as { start: { value: number | null; approximate: boolean }; end: { value: number | null; approximate: boolean } | null })
  }
  if (typeof v === 'string') return v
  return ''
}

// ── 13 section denormalizers ───────────────────────────────────────

export function denormalizeSubject(raw: unknown): SubjectFormData {
  const o = asObject(raw)
  return {
    full_name: asString(o.full_name),
    birth_name: asString(o.birth_name),
    birth_year: yfToString(o.birth_year),
    birth_month: intToString(o.birth_month),
    birth_day: intToString(o.birth_day),
    place_of_birth: asString(o.place_of_birth),
    nationality: asString(o.nationality),
    mother_tongue: asString(o.mother_tongue),
    subject_character_sketch: asString(o.subject_character_sketch),
  }
}

function denormalizeParent(raw: unknown): FatherFormData {
  const o = asObject(raw)
  return {
    name: asString(o.name),
    place_of_origin: asString(o.place_of_origin),
    birth_year: yfToString(o.birth_year),
    death_year: yfToString(o.death_year),
    profession: asString(o.profession),
  }
}

export function denormalizeFather(raw: unknown): FatherFormData {
  return denormalizeParent(raw)
}

export function denormalizeMother(raw: unknown): MotherFormData {
  return denormalizeParent(raw)
}

export function denormalizeFamilyContext(raw: unknown): FamilyContextFormData {
  const o = asObject(raw)
  const m = o.most_influential_parent
  const validEnum = m === 'father' || m === 'mother' || m === 'both' || m === 'neither'
  return {
    most_influential_parent: validEnum ? (m as 'father' | 'mother' | 'both' | 'neither') : '',
    parent_relationship_note: asString(o.parent_relationship_note),
  }
}

function denormalizeGrandparent(raw: unknown) {
  const o = asObject(raw)
  return {
    name: asString(o.name),
    birth_year: yfToString(o.birth_year),
    death_year: yfToString(o.death_year),
  }
}

export function denormalizeGrandparents(raw: unknown): GrandparentsFormData {
  const o = asObject(raw)
  return {
    paternal_grandfather: denormalizeGrandparent(o.paternal_grandfather),
    paternal_grandmother: denormalizeGrandparent(o.paternal_grandmother),
    maternal_grandfather: denormalizeGrandparent(o.maternal_grandfather),
    maternal_grandmother: denormalizeGrandparent(o.maternal_grandmother),
  }
}

export function denormalizeSiblings(raw: unknown): SiblingsFormData {
  const o = asObject(raw)
  return {
    count: intToString(o.count),
    names: asString(o.names),
  }
}

export function denormalizeEducation(raw: unknown): EducationFormData {
  const o = asObject(raw)
  const entries = asArray(o.entries).map((e) => {
    const ee = asObject(e)
    return {
      institution: asString(ee.institution),
      field: asString(ee.field),
      start_year: yfToString(ee.start_year),
      end_year: yfToString(ee.end_year),
    }
  })
  // useFieldArray needs at least one row to render — see EducationSection's
  // STEP 4 LOAD-PATH CONSTRAINT comment. If the canonical entries[] is
  // empty / absent, seed one empty row.
  if (entries.length === 0) entries.push({ institution: '', field: '', start_year: '', end_year: '' })
  return { entries }
}

export function denormalizeMilitary(raw: unknown): MilitaryFormData {
  const o = asObject(raw)
  return {
    served: asBoolean(o.served),
    branch: asString(o.branch),
    years: yrToString(o.years),
  }
}

export function denormalizeCareer(raw: unknown): CareerFormData {
  const o = asObject(raw)
  const stations = asArray(o.stations).map((s) => {
    const ss = asObject(s)
    return {
      employer: asString(ss.employer),
      role: asString(ss.role),
      location: asString(ss.location),
      years: yrToString(ss.years),
    }
  })
  // Same useFieldArray constraint as education — seed one empty row when absent.
  if (stations.length === 0) stations.push({ employer: '', role: '', location: '', years: '' })
  return { stations }
}

export function denormalizeRelationships(raw: unknown): RelationshipsFormData {
  const o = asObject(raw)
  const marriages = asArray(o.marriages).map((m) => {
    const mm = asObject(m)
    const rt = mm.relationship_type
    const dt = mm.dissolution_type
    const relationship_type: 'marriage' | 'partnership' | 'civil_partnership' =
      rt === 'partnership' || rt === 'civil_partnership' ? rt : 'marriage'
    const dissolution_type: 'ongoing' | 'divorced' | 'widowed' =
      dt === 'divorced' || dt === 'widowed' ? dt : 'ongoing'
    return {
      partner: asString(mm.partner),
      year: yfToString(mm.year),
      location: asString(mm.location),
      relationship_type,
      dissolution_type,
      dissolution_year: yfToString(mm.dissolution_year),
    }
  })
  const children = asArray(o.children).map((c) => {
    const cc = asObject(c)
    return {
      name: asString(cc.name),
      birth_year: yfToString(cc.birth_year),
    }
  })
  // EMPTY_MARRIAGE + EMPTY_CHILD seed (matches RelationshipsSection EMPTY_INITIAL).
  if (marriages.length === 0) {
    marriages.push({
      partner: '',
      year: '',
      location: '',
      relationship_type: 'marriage',
      dissolution_type: 'ongoing',
      dissolution_year: '',
    })
  }
  if (children.length === 0) {
    children.push({ name: '', birth_year: '' })
  }
  return { marriages, children }
}

export function denormalizeResidences(raw: unknown): ResidencesFormData {
  const o = asObject(raw)
  const entries = asArray(o.entries).map((e) => {
    const ee = asObject(e)
    return {
      city: asString(ee.city),
      country: asString(ee.country),
      start_year: yfToString(ee.start_year),
      end_year: yfToString(ee.end_year),
    }
  })
  if (entries.length === 0) entries.push({ city: '', country: '', start_year: '', end_year: '' })
  return { entries }
}

export function denormalizeAnchors(raw: unknown): AnchorsFormData {
  const o = asObject(raw)
  return {
    first_car_make_model: asString(o.first_car_make_model),
    lifelong_passion: asString(o.lifelong_passion),
    major_trip: asString(o.major_trip),
    special_possessions: asString(o.special_possessions),
  }
}

export function denormalizeHealth(raw: unknown): HealthFormData {
  const o = asObject(raw)
  const pacing = o.pacing
  const validPacing = pacing === 'full_pace' || pacing === 'moderate' || pacing === 'slow_with_breaks'
  // Cognitive adaptations: filter to canonical 5-value enum on load (defense
  // in depth + mirrors HealthSection D6 filter inside openFactSheet). Any
  // legacy or unknown value is dropped from form state so the user's edits
  // compose cleanly against the canonical space.
  const CANONICAL_COG_ADAPT = ['short_sentences', 'repeat_key_points', 'visual_aids', 'written_summaries', 'extra_time'] as const
  const cognitive_adaptations = asArray(o.cognitive_adaptations)
    .filter((v): v is typeof CANONICAL_COG_ADAPT[number] =>
      typeof v === 'string' && (CANONICAL_COG_ADAPT as readonly string[]).includes(v),
    )
  return {
    pacing: validPacing ? (pacing as 'full_pace' | 'moderate' | 'slow_with_breaks') : '',
    cognitive_adaptations,
    max_session_minutes: intToString(o.max_session_minutes),
    health_notes: asString(o.health_notes),
  }
}
