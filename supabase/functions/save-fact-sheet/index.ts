// save-fact-sheet
//
// Called by the React app on every section autosave (debounced 800ms via
// useFactSheetAutosave) AND on the final Abschicken click. Two body shapes:
//
//   Autosave: { token, section_id, responses }
//     - Validates responses against the section's canonical Zod schema
//       (mirrors factSheetTypes.ts Normalized* interfaces — YearField/
//        YearRange/derived ISO date_of_birth/etc.).
//     - On success, replaces biographical_facts[section_id] (read-merge-
//       write; non-atomic but safe because each token is single-interviewer).
//     - Promotes fact_sheet_status: pending → in_progress (unchanged otherwise).
//     - Always touches fact_sheet_last_activity_at.
//     - Rejects with 422 + field-level errors on Zod failure (caller surfaces
//       in form UI).
//     - Rejects with {ok:false, reason:'already_submitted'} if status is
//       terminal (no autosaves after submit).
//
//   Submit: { token, submitted: true }
//     - Sets fact_sheet_status = 'submitted', fact_sheet_submitted_at = now().
//     - Idempotent: re-submitting an already-submitted record returns 200
//       with {already_submitted: true} + the original submitted_at.
//     - Does NOT accept additional responses — caller flushes pending
//       autosave before firing submit (Phase B).
//
// Token validation pattern + CORS + service-role auth mirror
// validate-fact-sheet-token (Phase 2) verbatim.
//
// HTTP status convention (per Step 6 Phase A decision lock 2026-05-15):
//   - Token / business-logic failures: 200 + {ok:false, reason}
//   - Zod validation failures: 422 + {ok:false, reason:'validation_failed', errors:[...]}
//   - Method / shape failures: 400/405
//   - Server errors: 500
//
// Schema dependency: Canonical Mapping v1.1 §13 (health enums); section
// shapes mirror factsheet-teawithena-com src/lib/factSheetTypes.ts
// Normalized* interfaces. CROSS-REPO CONTRACT: if either side changes,
// both must update in lockstep.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@4.4.3'

// ── CORS ────────────────────────────────────────────────────────────
// Testing-phase whitelist. Lock down to factsheet.teawithena.com when
// customer launch goes live (drop localhost + .netlify.app entries).
const ALLOWED_ORIGINS = new Set([
  'https://factsheet.teawithena.com',
  'http://localhost:5173',
  'https://factsheet-teawithena-com.netlify.app',
])

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin)
    ? origin
    : 'https://factsheet.teawithena.com'
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

// ── Canonical building blocks ──────────────────────────────────────
// Mirror src/lib/factSheetTypes.ts YearField/YearRange.
const YearFieldSchema = z.object({
  value: z.number().int().nullable(),
  approximate: z.boolean(),
})
const YearRangeSchema = z.object({
  start: YearFieldSchema,
  end: YearFieldSchema.nullable(),
})

// ── Section schemas (mirror Normalized* interfaces) ────────────────

const SubjectSchema = z.object({
  full_name: z.string(),
  birth_name: z.string(),
  birth_year: YearFieldSchema,
  birth_month: z.number().int().min(1).max(12).nullable(),
  birth_day: z.number().int().min(1).max(31).nullable(),
  /** ISO YYYY-MM-DD when year+month+day all present; else null. Client derives. */
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  place_of_birth: z.string(),
  nationality: z.string(),
  mother_tongue: z.string(),
  subject_character_sketch: z.string(),
})

const ParentSchema = z.object({
  name: z.string(),
  place_of_origin: z.string(),
  birth_year: YearFieldSchema,
  death_year: YearFieldSchema,
  profession: z.string(),
})

const FamilyContextSchema = z.object({
  most_influential_parent: z.union([
    z.enum(['father', 'mother', 'both', 'neither']),
    z.literal(''),
  ]),
  parent_relationship_note: z.string(),
})

const GrandparentSchema = z.object({
  name: z.string(),
  birth_year: YearFieldSchema,
  death_year: YearFieldSchema,
})
const GrandparentsSchema = z.object({
  paternal_grandfather: GrandparentSchema,
  paternal_grandmother: GrandparentSchema,
  maternal_grandfather: GrandparentSchema,
  maternal_grandmother: GrandparentSchema,
})

const SiblingsSchema = z.object({
  count: z.number().int().nullable(),
  names: z.string(),
})

const EducationEntrySchema = z.object({
  institution: z.string(),
  field: z.string(),
  start_year: YearFieldSchema,
  end_year: YearFieldSchema,
})
const EducationSchema = z.object({ entries: z.array(EducationEntrySchema) })

const MilitarySchema = z.object({
  served: z.boolean(),
  branch: z.string(),
  years: YearRangeSchema,
})

const CareerStationSchema = z.object({
  employer: z.string(),
  role: z.string(),
  location: z.string(),
  years: YearRangeSchema,
})
const CareerSchema = z.object({ stations: z.array(CareerStationSchema).max(4) })

// Marriages: always-emit dissolution_year per phase-4.2 mirror + Step 5b drift #4
// (forced {value:null,approximate:false} when dissolution_type === 'ongoing').
const MarriageSchema = z.object({
  partner: z.string(),
  year: YearFieldSchema,
  location: z.string(),
  relationship_type: z.enum(['marriage', 'partnership', 'civil_partnership']),
  dissolution_type: z.enum(['ongoing', 'divorced', 'widowed']),
  dissolution_year: YearFieldSchema,
})
const ChildSchema = z.object({
  name: z.string(),
  birth_year: YearFieldSchema,
})
const RelationshipsSchema = z.object({
  marriages: z.array(MarriageSchema).max(3),
  children: z.array(ChildSchema).max(5),
})

const ResidenceEntrySchema = z.object({
  city: z.string(),
  country: z.string(),
  start_year: YearFieldSchema,
  end_year: YearFieldSchema,
})
const ResidencesSchema = z.object({ entries: z.array(ResidenceEntrySchema) })

const AnchorsSchema = z.object({
  first_car_make_model: z.string(),
  lifelong_passion: z.string(),
  major_trip: z.string(),
  special_possessions: z.string(),
})

// Health pacing: A2 canonical 3-value enum + ''. cognitive_adaptations: 5-value
// canonical enum array. max_session_minutes: int|null (coerced from string at client).
const HealthSchema = z.object({
  pacing: z.union([
    z.enum(['full_pace', 'moderate', 'slow_with_breaks']),
    z.literal(''),
  ]),
  cognitive_adaptations: z.array(z.enum([
    'short_sentences',
    'repeat_key_points',
    'visual_aids',
    'written_summaries',
    'extra_time',
  ])),
  max_session_minutes: z.number().int().nullable(),
  health_notes: z.string(),
})

const SECTION_SCHEMAS: Record<string, z.ZodTypeAny> = {
  subject: SubjectSchema,
  father: ParentSchema,
  mother: ParentSchema,
  family_context: FamilyContextSchema,
  grandparents: GrandparentsSchema,
  siblings: SiblingsSchema,
  education: EducationSchema,
  military: MilitarySchema,
  career: CareerSchema,
  relationships: RelationshipsSchema,
  residences: ResidencesSchema,
  anchors: AnchorsSchema,
  health: HealthSchema,
}

// ── Handler ─────────────────────────────────────────────────────────

serve(async (req) => {
  const origin = req.headers.get('origin')

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return json({ ok: false, reason: 'method_not_allowed' }, 405, origin)
  }

  let body: any
  try {
    body = await req.json()
  } catch (_) {
    return json({ ok: false, reason: 'invalid_body' }, 400, origin)
  }

  const token: unknown = body?.token
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) {
    return json({ ok: false, reason: 'malformed_token' }, 200, origin)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Single SELECT covers token-existence, expiry, status, and current
  // biographical_facts (needed for read-merge-write on autosave).
  const { data: row, error: selectErr } = await supabase
    .from('interviews')
    .select(
      'id, biographical_facts, fact_sheet_status, ' +
      'fact_sheet_token_expires_at, fact_sheet_submitted_at',
    )
    .eq('fact_sheet_token', token)
    .maybeSingle()

  if (selectErr) {
    console.error('Supabase select error:', selectErr)
    return json({ ok: false, reason: 'server_error' }, 500, origin)
  }
  if (!row) {
    return json({ ok: false, reason: 'token_not_found' }, 200, origin)
  }
  if (new Date(row.fact_sheet_token_expires_at) < new Date()) {
    return json({ ok: false, reason: 'expired' }, 200, origin)
  }

  // ── Submit branch ────────────────────────────────────────────────
  if (body?.submitted === true) {
    if (row.fact_sheet_status === 'submitted') {
      // Idempotent re-submit per D-EF2.
      return json(
        {
          ok: true,
          status: 'submitted',
          submitted_at: row.fact_sheet_submitted_at,
          already_submitted: true,
        },
        200,
        origin,
      )
    }
    const now = new Date().toISOString()
    const { error: submitErr } = await supabase
      .from('interviews')
      .update({
        fact_sheet_status: 'submitted',
        fact_sheet_submitted_at: now,
        fact_sheet_last_activity_at: now,
      })
      .eq('fact_sheet_token', token)
    if (submitErr) {
      console.error('Supabase submit-update error:', submitErr)
      return json({ ok: false, reason: 'server_error' }, 500, origin)
    }
    return json(
      { ok: true, status: 'submitted', submitted_at: now },
      200,
      origin,
    )
  }

  // ── Autosave branch ──────────────────────────────────────────────
  if (row.fact_sheet_status === 'submitted') {
    return json({ ok: false, reason: 'already_submitted' }, 200, origin)
  }

  const section_id: unknown = body?.section_id
  if (typeof section_id !== 'string' || !(section_id in SECTION_SCHEMAS)) {
    return json(
      { ok: false, reason: 'unknown_section', section_id },
      422,
      origin,
    )
  }

  const schema = SECTION_SCHEMAS[section_id]
  const parsed = schema.safeParse(body?.responses)
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
      code: issue.code,
    }))
    return json(
      { ok: false, reason: 'validation_failed', section_id, errors },
      422,
      origin,
    )
  }

  // Read-merge-write per D-EF1. Single-interviewer-per-token means no
  // concurrent-write race; precedent matches operator-platform's saveFacts.
  const currentFacts =
    row.biographical_facts && typeof row.biographical_facts === 'object'
      ? (row.biographical_facts as Record<string, unknown>)
      : {}
  const mergedFacts = { ...currentFacts, [section_id]: parsed.data }

  const now = new Date().toISOString()
  const updates: Record<string, unknown> = {
    biographical_facts: mergedFacts,
    fact_sheet_last_activity_at: now,
  }
  // Promote pending → in_progress on first autosave (operator-side sees activity).
  if (row.fact_sheet_status === 'pending') {
    updates.fact_sheet_status = 'in_progress'
  }

  const { error: updateErr } = await supabase
    .from('interviews')
    .update(updates)
    .eq('fact_sheet_token', token)
  if (updateErr) {
    console.error('Supabase autosave-update error:', updateErr)
    return json({ ok: false, reason: 'server_error' }, 500, origin)
  }

  return json(
    {
      ok: true,
      status: (updates.fact_sheet_status ?? row.fact_sheet_status) as string,
      section_id,
    },
    200,
    origin,
  )
})
