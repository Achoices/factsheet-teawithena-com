// Canonical-shape smoke harness — exercises normalizeForSave with named test
// inputs and prints what saveFactSheetSection would log. Not a unit test
// (no assertions); meant for human inspection of canonical shapes across
// every shipped section.
//
// Run: npx tsx scripts/smoke-canonical.ts
//
// History:
//   Step 5a — subject, father, education, military, career, grandparents, siblings
//   Step 5b — adds relationships (marriages + children) + residences,
//             including the ongoing-dissolution_year null-emit rule.
//   Step 3.9 — adds anchors (passthrough) + health (pacing + cognitive_adaptations
//              array + max_session_minutes int coercion + health_notes).

import { normalizeForSave } from '../src/lib/normalizeSection'

function check(label: string, sectionId: string, data: unknown): void {
  const out = normalizeForSave(sectionId, data)
  console.log('─'.repeat(80))
  console.log(label)
  console.log('[autosave stub]', sectionId, JSON.stringify(out, null, 2))
}

// 1 + 2. Subject birth_year=1925 → YF{1925, approximate:false}
check(
  '#1+2 Subject birth_year=1925 (plain 4-digit) → YearField{1925,false}',
  'subject',
  {
    full_name: 'Suse Müller',
    birth_name: '',
    birth_year: '1925',
    birth_month: '',
    birth_day: '',
    place_of_birth: 'Berlin',
    nationality: '',
    mother_tongue: '',
    subject_character_sketch: '',
  },
)

// 3. Father.birth_year=~1948 → YF{1948, approximate:true}
check(
  '#3 Father.birth_year=~1948 (approximate) → YearField{1948,true}',
  'father',
  {
    name: 'Hans Müller',
    place_of_origin: 'München',
    birth_year: '~1948',
    death_year: '',
    profession: 'Lehrer',
  },
)

// 4. Invalid year format (19xx) — Zod would reject at form layer; normalize
//    is tolerant (returns YF{null,false}). The validation error is upstream.
check(
  '#4 Subject birth_year="19xx" — invalid; Zod would reject. Normalize tolerates (YF{null,false}).',
  'subject',
  {
    full_name: 'Test',
    birth_name: '',
    birth_year: '19xx',
    birth_month: '',
    birth_day: '',
    place_of_birth: 'X',
    nationality: '',
    mother_tongue: '',
    subject_character_sketch: '',
  },
)

// 5. Subject year+month+day=1948-03-15 → date_of_birth: "1948-03-15"
check(
  '#5 Subject birth_year=1948 + month=3 + day=15 → date_of_birth:"1948-03-15"',
  'subject',
  {
    full_name: 'Test',
    birth_name: '',
    birth_year: '1948',
    birth_month: '3',
    birth_day: '15',
    place_of_birth: 'X',
    nationality: '',
    mother_tongue: '',
    subject_character_sketch: '',
  },
)

// 6. Subject year+month only (no day) → date_of_birth: null
check(
  '#6 Subject year=1948 + month=3 + no day → date_of_birth:null',
  'subject',
  {
    full_name: 'Test',
    birth_name: '',
    birth_year: '1948',
    birth_month: '3',
    birth_day: '',
    place_of_birth: 'X',
    nationality: '',
    mother_tongue: '',
    subject_character_sketch: '',
  },
)

// 7. Military.years "1965-1967" → YR{start:1965, end:1967}
check(
  '#7 Military.years="1965-1967" → YearRange{1965 → 1967}',
  'military',
  {
    served: true,
    branch: 'Marine',
    years: '1965-1967',
  },
)

// 8. Military.years "1965" (single) → YR{start:1965, end:null}
check(
  '#8 Military.years="1965" (single, no end) → YearRange{1965 → null}',
  'military',
  {
    served: true,
    branch: '',
    years: '1965',
  },
)

// 9. Military.years empty → explicit-empty YR{start:{null,false}, end:null}
check(
  '#9 Military.years="" (explicit-empty per drift #3) → YR{start:{null,false}, end:null}',
  'military',
  {
    served: false,
    branch: '',
    years: '',
  },
)

// 10. Education row start_year=~1955 + end_year=1962 → both YF
check(
  '#10 Education entry start=~1955 + end=1962 → YF{1955,true} + YF{1962,false}',
  'education',
  {
    entries: [
      { institution: 'Gymnasium', field: 'Latein', start_year: '~1955', end_year: '1962' },
    ],
  },
)

// 11. Career stations years "1985-2010" → YR shape
check(
  '#11 Career station years="1985-2010" → YearRange{1985 → 2010}',
  'career',
  {
    stations: [
      { employer: 'Acme', role: 'Engineer', location: 'Berlin', years: '1985-2010' },
    ],
  },
)

// 12. (Reload scenario — not testable here; documented separately.)
//     After reload, form resets to empty defaults; autosave doesn't fire on mount
//     (initialMountRef guard). Confirmed via useFactSheetAutosave.ts:43-46.

// Bonus: Grandparents
check(
  'Bonus — Grandparents 4-quadrant with mixed approximate flags',
  'grandparents',
  {
    paternal_grandfather: { name: 'Hans Müller', birth_year: '1895', death_year: '~1960' },
    paternal_grandmother: { name: '', birth_year: '', death_year: '' },
    maternal_grandfather: { name: 'Peter Schmidt', birth_year: '~1900', death_year: '1975' },
    maternal_grandmother: { name: '', birth_year: '', death_year: '' },
  },
)

// Bonus: Siblings count coercion
check(
  'Bonus — Siblings count="3" → number 3; names passthrough',
  'siblings',
  {
    count: '3',
    names: 'Claudia, Peter',
  },
)

// Bonus: Subject with NO year input (empty form) — explicit-empty YF + date_of_birth:null
check(
  'Bonus — Subject empty year input → YF{null,false} + date_of_birth:null',
  'subject',
  {
    full_name: '',
    birth_name: '',
    birth_year: '',
    birth_month: '',
    birth_day: '',
    place_of_birth: '',
    nationality: '',
    mother_tongue: '',
    subject_character_sketch: '',
  },
)

// ═══════════════════════════════════════════════════════════════════════
// Step 5b additions — Relationships + Residences
// ═══════════════════════════════════════════════════════════════════════

// R1. Marriage with dissolution_type='divorced' + dissolution_year='1995' →
//     dissolution_year: YF{1995,false}
check(
  '#R1 Marriage divorced + dissolution_year=1995 → YF{1995,false}',
  'relationships',
  {
    marriages: [
      {
        partner: 'Anna Schmidt',
        year: '1955',
        location: 'Berlin',
        relationship_type: 'marriage',
        dissolution_type: 'divorced',
        dissolution_year: '1995',
      },
    ],
    children: [],
  },
)

// R2. THE CORE DRIFT #4 INVERSION TEST — ongoing dissolution_type forces null
//     even if form state holds a value. Mimics smoke #5 from the patch:
//     user typed '1995', then flipped to ongoing → form retains '1995' but
//     normalize emits {null,false}.
check(
  '#R2 (drift #4 inversion) Marriage ongoing BUT form state has dissolution_year=1995 → FORCED YF{null,false}',
  'relationships',
  {
    marriages: [
      {
        partner: 'Anna Schmidt',
        year: '1955',
        location: 'Berlin',
        relationship_type: 'marriage',
        dissolution_type: 'ongoing',
        dissolution_year: '1995', // user typed this, then toggled to ongoing
      },
    ],
    children: [],
  },
)

// R3. Toggle back to divorced WITHOUT clearing input → '1995' is re-emitted
//     verbatim (no destructive loss; user gets their value back).
check(
  '#R3 Toggle back to divorced — same dissolution_year=1995 in form state → YF{1995,false} re-emitted',
  'relationships',
  {
    marriages: [
      {
        partner: 'Anna Schmidt',
        year: '1955',
        location: 'Berlin',
        relationship_type: 'marriage',
        dissolution_type: 'divorced',
        dissolution_year: '1995',
      },
    ],
    children: [],
  },
)

// R4. Empty ongoing → YF{null,false}, dissolution_year key still PRESENT
check(
  '#R4 Empty ongoing marriage → dissolution_year YF{null,false} still PRESENT (always-emit)',
  'relationships',
  {
    marriages: [
      {
        partner: '',
        year: '',
        location: '',
        relationship_type: 'marriage',
        dissolution_type: 'ongoing',
        dissolution_year: '',
      },
    ],
    children: [],
  },
)

// R5. Widowed with approximate ~1988 → YF{1988,true}
check(
  '#R5 Widowed + dissolution_year=~1988 → YF{1988,true}',
  'relationships',
  {
    marriages: [
      {
        partner: 'Hans Müller',
        year: '~1960',
        location: '',
        relationship_type: 'partnership',
        dissolution_type: 'widowed',
        dissolution_year: '~1988',
      },
    ],
    children: [],
  },
)

// R6. 2 children, both with birth_year — verify each becomes YF
check(
  '#R6 Two children with birth_year → 2 YF objects',
  'relationships',
  {
    marriages: [],
    children: [
      { name: 'Claudia', birth_year: '1958' },
      { name: 'Peter', birth_year: '~1962' },
    ],
  },
)

// R7. Civil partnership with all fields populated
check(
  '#R7 Civil partnership, divorced, full payload — relationship_type discriminator preserved',
  'relationships',
  {
    marriages: [
      {
        partner: 'Sam Berg',
        year: '2005',
        location: 'Hamburg',
        relationship_type: 'civil_partnership',
        dissolution_type: 'divorced',
        dissolution_year: '2018',
      },
    ],
    children: [],
  },
)

// Res1. Residences entry with both years populated
check(
  '#Res1 Residence Berlin 1985-2010 → both YF',
  'residences',
  {
    entries: [
      { city: 'Berlin', country: 'Deutschland', start_year: '1985', end_year: '2010' },
    ],
  },
)

// Res2. 3 entries, mixed years
check(
  '#Res2 Three residences with mixed approximate + range patterns',
  'residences',
  {
    entries: [
      { city: 'München', country: 'DE', start_year: '~1948', end_year: '1962' },
      { city: 'Wien', country: 'AT', start_year: '1962', end_year: '1985' },
      { city: 'Berlin', country: 'DE', start_year: '1985', end_year: '' }, // ongoing residence
    ],
  },
)

// Res3. Empty residence entry — explicit-empty YFs
check(
  '#Res3 Empty residence entry → YF{null,false} for both years',
  'residences',
  {
    entries: [{ city: '', country: '', start_year: '', end_year: '' }],
  },
)

// ═══════════════════════════════════════════════════════════════════════
// Phase 3.9 additions — Anchors + Health
// ═══════════════════════════════════════════════════════════════════════

// A1. Anchors all four fields populated → passthrough verbatim
check(
  '#A1 Anchors all four fields populated → passthrough verbatim',
  'anchors',
  {
    first_car_make_model: 'VW Käfer 1303 (1978)',
    lifelong_passion: 'Garten und Imkerei',
    major_trip: 'Sechs Monate Australien, 1985',
    special_possessions: 'Großvaters Taschenuhr; ein Brief aus dem Krieg',
  },
)

// A2. Anchors all empty → identity passthrough with empty strings
check(
  '#A2 Anchors all-empty → identity passthrough with empty strings',
  'anchors',
  {
    first_car_make_model: '',
    lifelong_passion: '',
    major_trip: '',
    special_possessions: '',
  },
)

// H1. Health full — pacing canonical enum, cognitive_adaptations array preserved,
//     max_session_minutes coerced string→int, health_notes passthrough
check(
  '#H1 Health full — pacing+cog_adapt[2]+max_session=75+notes → canonical with int 75',
  'health',
  {
    pacing: 'full_pace',
    cognitive_adaptations: ['short_sentences', 'extra_time'],
    max_session_minutes: '75',
    health_notes: 'Morgens am besten ansprechbar; nach 16:00 wird sie müde.',
  },
)

// H2. Health all empty → pacing:'' + empty array + null minutes + empty notes
check(
  '#H2 Health all-empty → pacing:"" + [] + max_session_minutes:null + notes:""',
  'health',
  {
    pacing: '',
    cognitive_adaptations: [],
    max_session_minutes: '',
    health_notes: '',
  },
)

// H3. Health partial — pacing='moderate', cog_adapt=['visual_aids'] only
check(
  '#H3 Health partial — pacing=moderate + cog_adapt=[visual_aids] only',
  'health',
  {
    pacing: 'moderate',
    cognitive_adaptations: ['visual_aids'],
    max_session_minutes: '',
    health_notes: '',
  },
)

// H4 (bonus). All 5 canonical cognitive_adaptation values selected — array order preserved.
check(
  '#H4 (bonus) All 5 cognitive_adaptations selected → array preserved verbatim',
  'health',
  {
    pacing: 'slow_with_breaks',
    cognitive_adaptations: [
      'short_sentences',
      'repeat_key_points',
      'visual_aids',
      'written_summaries',
      'extra_time',
    ],
    max_session_minutes: '45',
    health_notes: '',
  },
)

// H5 (bonus). max_session_minutes = '0' → parseIntOrNull returns 0 (not null).
//   Note: '0' is not a sensible session length, but the harness verifies the
//   helper's actual behavior — Number.isFinite-based, not truthiness-based.
check(
  '#H5 (bonus) max_session_minutes="0" → parseIntOrNull returns 0 (Number.isFinite, not truthy-coerced)',
  'health',
  {
    pacing: '',
    cognitive_adaptations: [],
    max_session_minutes: '0',
    health_notes: '',
  },
)

console.log('─'.repeat(80))
console.log('Smoke complete.')
