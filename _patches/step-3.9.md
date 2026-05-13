# STEP 3.9 — Section 11 Anchors + Section 12 Health

Last Phase 3 section step. New CheckboxGroup component for cognitive_adaptations multi-select.

## Architectural context

- Anchors: 4 simple fields, all optional, canonical names already in factsheet schema (first_car_make_model, lifelong_passion, major_trip, special_possessions). Operator-side renames handled by Step 4. ~80 LOC.
- Health: pacing (single-select enum), cognitive_adaptations (multi-select string[]), max_session_minutes (int), health_notes (free text).
- NEW COMPONENT: CheckboxGroup, sibling to RadioGroup. Same Input V1 token palette, same a11y pattern, but multi-select with string[] state. Requires RHF Controller because array values aren't register()-compatible.

## STEPS

0. Discovery + report (BLOCKING).
1. Build CheckboxGroup component (.tsx + .css + export).
2. Build AnchorsSection.tsx.
3. Build HealthSection.tsx.
4. Extend normalizeSection.ts (normalizeAnchors identity; normalizeHealth with parseIntOrNull on max_session_minutes).
5. Wire SectionPage routes.
6. Extend scripts/smoke-canonical.ts with A1, A2, H1-H5 cases.

## DE labels (sensible defaults, flag for brand review)

Anchors:
- first_car_make_model: "Erstes Auto (Marke, Modell, ca. Jahr)" / placeholder "z.B. VW Käfer 1303 (1978)"
- lifelong_passion: "Lebenslange Leidenschaft / Hobby"
- major_trip: "Wichtigste Reise / Zeit im Ausland"
- special_possessions: "Besondere Besitztümer (die Geschichten tragen)"

Health.pacing options:
- full_pace: "Volles Tempo"
- moderate: "Mittleres Tempo, gelegentliche Pausen"
- slow_with_breaks: "Langsam, mit regelmäßigen Pausen"

Health.cognitive_adaptations options (5-value canonical enum):
- short_sentences: "Kurze Sätze verwenden"
- repeat_key_points: "Wichtige Punkte wiederholen"
- visual_aids: "Visuelle Hilfen (Fotos, Notizen)"
- written_summaries: "Schriftliche Zusammenfassungen"
- extra_time: "Mehr Zeit, wenn nötig"

## CheckboxGroup API (LOCKED)

```typescript
type CheckboxOption = { value: string; label: string }
type CheckboxGroupProps = {
  id: string
  label: string
  required?: boolean
  helpText?: string
  error?: string
  options: CheckboxOption[]
  value: string[]
  onChange: (newValues: string[]) => void
  onBlur?: FocusEventHandler<HTMLInputElement>
  name?: string
  disabled?: boolean
}
```

Implementation: forwardRef<HTMLInputElement>, fieldset/legend semantic pattern matching RadioGroup, role="group" on inner div, hidden native checkboxes with visible 18×18 square markers + CSS-only checkmark when checked. Toggle semantics: `next = value.includes(opt.value) ? value.filter(v => v !== opt.value) : [...value, opt.value]; onChange(next)`. Never mutates incoming array.

## Drift items resolved

1. cognitive_adaptations canonical 5-value enum: WRITE CANONICAL. Asymmetric period with operator's 3-value UI tracked as BACKLOG-HEALTH-COGNITIVE-ADAPTATIONS-001 (sharpened trigger: operator relabel must happen before Step 6 customer-facing ship).
2. CheckboxGroup uses BACKLOG-DESIGN-SYSTEM-007 (RadioGroup uses -008 for itself — different identifiers, both valid).
3. scripts/smoke-canonical.ts as single growing harness — extended.
4. parseIntOrNull helper reused from siblings.count pattern for max_session_minutes (consistency).
5. normalizeAnchors as explicit identity function — matches "every section has a normalizer" dispatcher convention.

## Commit

phase-3.3.9: section 11 Anchors + section 12 Health + CheckboxGroup component (cognitive_adaptations multi-select)

## OUTCOME

Files shipped:
- NEW: src/design-system/components/Input/CheckboxGroup.tsx + .css; exported from index.ts
- NEW: src/routes/sections/AnchorsSection.tsx
- NEW: src/routes/sections/HealthSection.tsx
- MOD: src/lib/factSheetTypes.ts (NormalizedAnchors, NormalizedHealth, PacingValue, CognitiveAdaptation types)
- MOD: src/lib/normalizeSection.ts (normalizeAnchors + normalizeHealth + 2 dispatcher cases)
- MOD: src/routes/SectionPage.tsx (two new routes wired; placeholder fallback retained as defensive no-op)
- MOD: scripts/smoke-canonical.ts (A1, A2, H1-H5 cases)

Smoke results: see `npx tsx scripts/smoke-canonical.ts`. All 7 new cases (5 in scope + 2 bonus) produce correct canonical shapes. max_session_minutes "75" → int 75; empty → null; "0" → 0 (Number.isFinite-based).

Phase 3 form-side build COMPLETE. Next: operator phase-4.2 (dissolution_year ongoing-null mirror) + Step 6 Edge Function + load path.
