# Step 5a Patch Prompt — factsheet Year-Field Retrofit

**Architecture decision:** Option D + CANONICAL-MAPPING-v1.0 (YearField + YearRange types)
**Target:** `/Users/flavz/ai_agents/factsheet-teawithena-com`
**Phase 3 baseline:** `f30cfd4` (Phase 3.6 — sections 01-08 shipped)
**Parallel work:** Step 4 already shipped and verified (commit on operator-platform). No conflict with this work (different repos).

## Purpose

Retrofit 6 already-shipped factsheet sections (Subject, Father, Mother, Grandparents, Education, Military, Career) to output canonical YearField / YearRange structured objects instead of `~1925` string patterns. Add Subject `date_of_birth` ISO derivation. Update Zod schemas in lockstep.

## STEP 0 — Discovery + Report (BLOCKING)

Do not write implementation code yet.

### 0.1 Working tree
```bash
cd /Users/flavz/ai_agents/factsheet-teawithena-com
git status
git log -1 --oneline    # expect: f30cfd4 (Phase 3.6) at top
```

### 0.2 Inventory current year fields
```bash
grep -rn "\\^~?\\\\d{4}" src/
```

Expected fields using year regex:
- Subject.birth_year (`^\d{4}$` required, no `~` allowed currently)
- Father/Mother birth_year, death_year (`^~?\d{4}$`)
- Grandparents × 4 entries × birth_year, death_year
- Education entries × start_year, end_year
- Military.years (`^~?\d{4}(-\d{4})?$` — range allowed)
- Career stations × years (`^~?\d{4}(-\d{4})?$`)

### 0.3 Current factSheetSave.ts stub
```bash
cat src/lib/factSheetSave.ts
```
Confirm it's still the simple console.log stub from STEP 3.1.

### 0.4 Current RHF + Zod pattern
Read one section (e.g. SubjectSection) and one schema for that section. Confirm form state is `string`-typed and validation is via Zod regex.

### 0.5 CURRENT AUTOSAVE SHAPE — paste DevTools console output
Run dev server. Visit /form/subject?token=ileQZWwOMfgoWh5wgIZgusAkaZt1O-h0pK1ke92DWgo. Type "1925" in birth_year, blur. Paste DevTools console output of the autosave stub. Need to see the CURRENT shape before retrofit.

### 0.6 Zod .transform() vs manual transform decision
Decide: will Zod `.transform()` produce a clean Resolver<TFieldValues> typing pattern with RHF? If yes, use Zod transform. If no, fall back to manual transform in factSheetSave.ts before autosave fires. Make the call in STEP 0 report based on what works, don't guess in STEP 1.

### 0.7 REPORT BACK
- 0.1 + 0.2 + 0.3 + 0.4 results
- 0.5 console output sample
- 0.6 your decision on Zod .transform() vs manual
- Any drift from this prompt

Wait for PM chat approval before STEP 1.

## TYPE DEFINITIONS to add (LOCKED)

```typescript
export type YearField = { value: number | null; approximate: boolean };
export type YearRange = { start: YearField; end: YearField | null };
export const EMPTY_YEAR_FIELD: YearField = { value: null, approximate: false };
export const EMPTY_YEAR_RANGE: YearRange = { start: EMPTY_YEAR_FIELD, end: null };
```

Location: `src/lib/factSheetTypes.ts` (NEW file).

## STEP 1 — Helpers + Types

Wait for STEP 0 approval.

Create `src/lib/factSheetTypes.ts` (exports above).

Create `src/lib/yearFieldHelpers.ts`:
```typescript
export function parseYearField(input: string): YearField {
  const trimmed = input.trim();
  if (!trimmed) return EMPTY_YEAR_FIELD;
  const approximate = trimmed.startsWith('~');
  const stripped = approximate ? trimmed.slice(1) : trimmed;
  const match = stripped.match(/^(\d{4})$/);
  return { value: match ? parseInt(match[1], 10) : null, approximate };
}

export function formatYearField(yf: YearField): string {
  if (yf.value == null) return '';
  return (yf.approximate ? '~' : '') + String(yf.value);
}

export function parseYearRange(input: string): YearRange {
  // ALWAYS returns YearRange object (never null) for canonical consistency with operator side
  const trimmed = input.trim();
  if (!trimmed) return EMPTY_YEAR_RANGE;
  const parts = trimmed.split('-');
  const start = parseYearField(parts[0]);
  const end = parts.length > 1 ? parseYearField(parts[1]) : null;
  return { start, end };
}

export function formatYearRange(yr: YearRange | null): string {
  if (!yr || yr.start.value == null) return '';
  const startStr = formatYearField(yr.start);
  if (!yr.end) return startStr;
  return startStr + '-' + formatYearField(yr.end);
}
```

NOTE: parseYearRange returns EMPTY_YEAR_RANGE (not null) for empty input — matches operator's Step 4 explicit-empty emission per drift #3 resolution.

## STEP 2 — Schemas + section components

Wait for STEP 1 ready.

### Strategy decision (from STEP 0.6): Zod .transform() OR manual

If Zod .transform(): schema output type = YearField/YearRange. RHF Resolver handles input/output split.
If manual: schema stays string-typed. Transform in factSheetSave.ts before autosave logs.

### Per-section retrofit

**Subject:**
- birth_year: `z.string().regex(/^\d{4}$/).transform(parseYearField)` → YearField
- birth_month, birth_day: string regex + transform to `number | null`
- date_of_birth: derived in schema transform — when year.value + month + day all non-null, output ISO "YYYY-MM-DD"; else null

**Father/Mother:**
- birth_year, death_year: `z.union([z.string().regex(/^~?\d{4}$/), z.literal('')]).transform(parseYearField)` → YearField

**Grandparents:** same YearField transform on 4 × {birth_year, death_year}

**Education entries:** same YearField transform on per-entry {start_year, end_year}

**Military.years:** regex + `.transform(parseYearRange)` → YearRange

**Career stations × years:** same YearRange transform

**Siblings:** count string → int transform; names stays string

**Family Context, anchors, health, relationships, residences:** not shipped yet OR no year fields. Skip in 5a.

## STEP 3 — Verify autosave payloads

After STEP 2: visit each section, type test inputs, verify console shows canonical YearField / YearRange shapes.

## SMOKE CHECKS

1. /form/subject?token=ileQZWwOMfgoWh5wgIZgusAkaZt1O-h0pK1ke92DWgo
2. Type 1925 in Subject.birth_year, blur → console: `birth_year: {value: 1925, approximate: false}`
3. Type ~1948 in Father.birth_year → `{value: 1948, approximate: true}`
4. Type 19xx in birth_year → validation error
5. Subject birth_year=1948 + month=3 + day=15 → autosave payload includes `date_of_birth: "1948-03-15"`
6. Subject year+month only (no day) → `date_of_birth: null`
7. Military.years "1965-1967" → `{start:{value:1965,...}, end:{value:1967,...}}`
8. Military.years "1965" single → `{start:{value:1965,...}, end: null}`
9. Military.years empty → `{start:{value:null,approximate:false}, end:null}` (explicit empty, matches operator)
10. Education row start_year ~1955 + end_year 1962 → both YearField
11. Career station years "1985-2010" → YearRange shape
12. Reload mid-section → form resets to empty (no load path yet)

## Commit

```
phase-5a: factsheet year-field retrofit to YearField + YearRange canonical types
```

## Out of scope
- Operator code (Step 4 — done)
- Phase 3 STEP 3.7+ sections (Step 5b)
- save-fact-sheet Edge Function (Step 6)
- Load path (Step 6)
- Phase 2 routes

After STEP 0 report-back: PM chat approves STEP 1+2+3 in one block. Realistic 60-90 min.

---

## STEP 0 OUTCOME (2026-05-12)

**Decision: manual transform (not Zod `.transform()`).** Rationale: form.watch() returns RHF's TFieldValues (input type, strings); Zod 4 transforms are only applied via handleSubmit, which the autosave path doesn't use. .transform() would give false sense of canonical output while shipping unchanged string payloads.

**Implementation diff from this patch's STEP 2 spec:**
- Schemas stay 100% string-typed (no `.transform()` anywhere).
- Conversion lives in NEW `src/lib/normalizeSection.ts` with per-section normalize* functions + `normalizeForSave(sectionId, data)` dispatcher.
- `saveFactSheetSection` pipes payload through `normalizeForSave` before logging/posting.
- Subject `date_of_birth` ISO derivation inside `normalizeSubject` (not in schema transform).
- Siblings count coercion inside `normalizeSiblings`.

## STEP 1+2+3 OUTCOME — files shipped

NEW:
- `src/lib/factSheetTypes.ts` — YearField, YearRange, EMPTY_* + per-section Normalized* shapes
- `src/lib/yearFieldHelpers.ts` — parseYearField, formatYearField, parseYearRange, formatYearRange
- `src/lib/normalizeSection.ts` — 8 normalize* functions + dispatcher
- `scripts/smoke-step5a.ts` — 11-point smoke harness (run via `npx tsx scripts/smoke-step5a.ts`)

MODIFIED:
- `src/lib/factSheetSave.ts` — calls `normalizeForSave` before console.log; persistence-boundary comment
- `src/hooks/useFactSheetAutosave.ts` — docstring addendum on shape boundary

UNCHANGED:
- `src/lib/factSheetSchema.ts` — no schema modifications
- 8 section components — no per-section changes

## SMOKE RESULTS (2026-05-12)

All 11 checks + 3 bonuses pass. See commit + `scripts/smoke-step5a.ts` for the harness and its console output.
