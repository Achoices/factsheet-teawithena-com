# STEP 5b — Phase 3 STEP 3.7 (Relationships) + STEP 3.8 (Residences)

Two sections, one commit block.

## Architectural context from canonical mapping

- Relationships: marriages[] (up to 3) + children[] (up to 5), nested under biographical_facts.relationships.
- Canonical persistence shape for marriages: ALWAYS-PRESENT keys including dissolution_year as YearField. UI hides dissolution_year input when ongoing.
- Year fields are STRING in form state (per Step 5a discipline), normalized to YearField via normalizeSection.ts in factSheetSave path.
- Residences: factsheet writes residences.entries[] (canonical, nested wrapper). Operator-platform's legacy biographical_facts.residences string-array stays untouched on operator side per Step J coordination. Factsheet doesn't touch the legacy key at all.

## STEP 0 — Discovery (BLOCKING)

0.1 Working tree (clean, on main, at 4c6800f phase-5a).
0.2 Confirm relationships + residences schemas in factSheetSchema.ts.
0.3 Confirm RadioGroup component still works.
0.4 Confirm normalizeSection.ts is the right home for new YearField transforms.
0.5 Confirm SectionPage placeholders for 'relationships' + 'residences'.
0.6 Report back with drift items.

## STEPS 1-6 (one work block, post-approval)

1. Build RelationshipsSection.tsx (RHF + useFieldArray×2, RadioGroup×2 per marriage, conditional dissolution_year reveal).
2. Build ResidencesSection.tsx (useFieldArray on entries, no max).
3. Extend normalizeSection.ts (normalizeRelationships with ongoing-nulls dissolution_year rule, normalizeResidences).
4. Wire SectionPage routes.
5. Rename scripts/smoke-step5a.ts → smoke-canonical.ts and extend with R1-R7 + Res1-Res3 cases.
6. Smoke checks via dev server + Node harness.

## DRIFT #4 RESOLUTION (architectural inversion)

In normalizeRelationships, when dissolution_type === 'ongoing', force dissolution_year to EMPTY_YEAR_FIELD ({value: null, approximate: false}) regardless of what the form state holds. When dissolution_type !== 'ongoing', parseYearField from form state as normal.

This:
- Keeps canonical "always-present key" property
- Aligns value with semantic truth (ongoing → no dissolution year possible)
- Eliminates the logical inconsistency where ongoing + 1995 could land on disk
- Simplifies operator phase-4.2 fix (no defensive read-side filter needed)

UI BEHAVIOR (unchanged): dissolution_year input is hidden when dissolution_type='ongoing'. RHF retains the typed value in form state across the toggle. The user's typed value is preserved IN FORM STATE for the duration of their session — if they flip back to divorced/widowed mid-session, the value reappears. But on save (normalize), value is nullified for ongoing.

Operator-platform phase-4.2 must mirror this rule.

## SMOKE CHECKS (Step 6)

1. /form/relationships?token=... renders 1 marriage row + 1 child row + add buttons
2. Add 2 more marriages → 3 rows visible + add button disabled at 3
3. Set dissolution_type=divorced on marriage[0] → dissolution_year input appears
4. Set dissolution_type=ongoing → dissolution_year input hides (but form state retains it for autosave)
5. Type 1995 in dissolution_year, set dissolution_type=divorced → autosave emits dissolution_year:{1995,false}. Toggle to ongoing → autosave emits {null,false} (semantic truth wins). Toggle back to divorced WITHOUT clearing → form state retains 1995 → emits {1995,false} again.
6. Set dissolution_type=ongoing with empty dissolution_year → autosave payload shows dissolution_year:{null,false} (always emitted)
7. Add 4 children → 5 visible + add disabled at 5
8. /form/residences renders 1 entry row + add button
9. Add 3 more residences → 4 rows + add still enabled (no max)
10. Type 1985-2010 in residence start_year/end_year → both YearField in autosave

## Commit

phase-3.3.7-3.3.8: section 09 Relationships (marriages + children, conditional UI + always-emit + ongoing-nulls dissolution_year) + section 10 Residences (useFieldArray, no max)

## Out of scope

- operator-platform — phase-4.2 follow-up handles the mirror null-when-ongoing rule
- Edge Function — Step 6
- DIALOGO / Step J coordination
- Sections 11 (anchors) + 12 (health) — STEP 3.9 (next)

## STEP 0 OUTCOME (2026-05-12)

Approved with one architectural inversion (Drift #4 above). All other drift items resolved: EMPTY_MARRIAGE defaults 'marriage'/'ongoing', smoke harness renamed to smoke-canonical.ts (single growing harness), RHF shouldUnregister default behavior noted, partner/year stay optional in schema.

## STEPS 1-6 OUTCOME

Files shipped:
- NEW: src/routes/sections/RelationshipsSection.tsx
- NEW: src/routes/sections/ResidencesSection.tsx
- MOD: src/lib/factSheetTypes.ts (NormalizedMarriage/Child/Relationships/ResidenceEntry/Residences types + RelationshipType/DissolutionType unions)
- MOD: src/lib/normalizeSection.ts (normalizeRelationships with ongoing-nulls rule + normalizeResidences; dispatcher cases added)
- MOD: src/routes/SectionPage.tsx (two new routes wired)
- RENAMED: scripts/smoke-step5a.ts → scripts/smoke-canonical.ts; +10 new cases (R1-R7, Res1-Res3)

Smoke results: see `npx tsx scripts/smoke-canonical.ts` output at commit time. R2 (drift #4 inversion) and R3 (toggle-back recovery) both produce correct canonical shapes.
