import { useCallback } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { careerSchema, type CareerFormData } from '../../lib/factSheetSchema'
import { useFactSheetAutosave } from '../../hooks/useFactSheetAutosave'
import { useSaveFactSheetSection } from '../../lib/factSheetSave'
import { zodPathToRhfName } from '../../lib/zodPathToRhfName'
import { useSetSectionValidator } from '../../lib/sectionValidationContext'
import { TextInput } from '../../design-system/components/Input'

const MAX_STATIONS = 4
const EMPTY_STATION = { employer: '', role: '', location: '', years: '' }
const EMPTY_INITIAL: CareerFormData = { stations: [EMPTY_STATION] }

// ─────────────────────────────────────────────────────────────────────────
// BACKLOG-PRE-STEP-4-001 — operator-platform path mismatch (Career)
// ─────────────────────────────────────────────────────────────────────────
// Factsheet writes:   biographical_facts.career = { stations: [...] }
// Operator writes:    biographical_facts.career = [...]          (bare array, NO wrapping object)
//
// Two divergences:
//   1. Shape — factsheet wraps the array under .stations; operator stores the
//      array directly at .career. Operator's read path already accepts both
//      facts.career (canonical) and facts.career_stations (legacy fallback),
//      but it does NOT look at facts.career.stations.
//   2. Field rename — factsheet field `location` corresponds to operator's
//      stored field `city`. Operator already maps UI-side `location` → DB-side
//      `city` on save (see operator-platform/index.html:2909). Factsheet would
//      write `location` directly, conflicting with operator's stored shape.
//
// Minor: operator stores empty fields as `null` (not `""`); factsheet keeps `""`.
// Less load-bearing — the operator read path falls back to '—' for null OR ''.
//
// STEP 4's factSheetSave.ts normalize step will need to translate factsheet's
// shape to the operator-compatible shape on the way to the DB. Audit logged
// as BACKLOG-PRE-STEP-4-001. Recommended direction: factsheet writes nested-
// stations + location (Document Definitions v1.3.0 canonical); operator-
// platform load+save adapts to read either shape and write the canonical
// going forward.
// ─────────────────────────────────────────────────────────────────────────

// useFieldArray needs at least one entry to render. We default to one empty
// station so the section never appears blank. STEP 4 LOAD-PATH CONSTRAINT
// (same as EducationSection): when the load path returns stations === undefined
// or [], it MUST ensure at least one empty entry is present before form.reset()
// so fields.map() has something to render. Pattern:
//   const loaded = response.stations ?? []
//   form.reset({ stations: loaded.length > 0 ? loaded : [EMPTY_STATION] })

export function CareerSection() {
  const form = useForm<CareerFormData>({
    resolver: zodResolver(careerSchema),
    defaultValues: EMPTY_INITIAL,
    mode: 'onBlur',
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'stations',
  })

  const save = useSaveFactSheetSection()

  useFactSheetAutosave<CareerFormData>({
    sectionId: 'career',
    data: form.watch(),
    saveFunction: save,
    onValidationError: (errors) => {
      errors.forEach((err) => {
        const name = zodPathToRhfName(err.path)
        if (name) form.setError(name as never, { type: 'server', message: err.message })
      })
    },
  })

  const validate = useCallback(() => form.trigger(), [form])
  useSetSectionValidator(validate)

  const { register, formState: { errors } } = form
  const stationErrors = errors.stations
  const atMax = fields.length >= MAX_STATIONS

  return (
    <form className="space-y-8" noValidate>
      {fields.map((field, i) => (
        <div
          key={field.id}
          className={i > 0 ? 'pt-8 border-t border-rule space-y-4' : 'space-y-4'}
        >
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <TextInput
                id={`career-${i}-employer`}
                label="Arbeitgeber"
                error={stationErrors?.[i]?.employer?.message}
                {...register(`stations.${i}.employer`)}
              />
            </div>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="mt-8 font-body text-xs text-ink-soft hover:text-danger transition-colors duration-200 focus-ring px-2 py-1"
                aria-label={`Station ${i + 1} entfernen`}
              >
                Entfernen
              </button>
            )}
          </div>
          <TextInput
            id={`career-${i}-role`}
            label="Position"
            error={stationErrors?.[i]?.role?.message}
            {...register(`stations.${i}.role`)}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              id={`career-${i}-location`}
              label="Ort"
              error={stationErrors?.[i]?.location?.message}
              {...register(`stations.${i}.location`)}
            />
            <TextInput
              id={`career-${i}-years`}
              label="Jahre"
              placeholder="1985-1998"
              inputMode="numeric"
              error={stationErrors?.[i]?.years?.message}
              {...register(`stations.${i}.years`)}
            />
          </div>
        </div>
      ))}

      <div className="pt-4">
        <button
          type="button"
          onClick={() => !atMax && append(EMPTY_STATION)}
          disabled={atMax}
          title={atMax ? 'Maximal 4 Stationen' : undefined}
          className={[
            'font-body text-sm border border-rule px-4 py-3 rounded inline-flex items-center gap-2 focus-ring transition-colors duration-200',
            atMax
              ? 'text-muted-soft cursor-not-allowed opacity-60'
              : 'text-ink-soft hover:bg-bg-sunken hover:border-border-strong',
          ].join(' ')}
        >
          <span aria-hidden="true">+</span>
          Weitere Station hinzufügen
        </button>
      </div>
    </form>
  )
}
