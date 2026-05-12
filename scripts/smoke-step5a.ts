// Step 5a smoke harness — exercises normalizeForSave with the 12 test inputs
// from the patch prompt and prints what saveFactSheetSection would log.
// Not a unit test (no assertions); meant for human inspection of canonical shapes.
//
// Run: npx tsx scripts/smoke-step5a.ts

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

console.log('─'.repeat(80))
console.log('Smoke complete.')
