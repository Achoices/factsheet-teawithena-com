import { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { militarySchema, type MilitaryFormData } from '../../lib/factSheetSchema'
import { useFactSheetAutosave } from '../../hooks/useFactSheetAutosave'
import { saveFactSheetSection } from '../../lib/factSheetSave'
import { useSetSectionValidator } from '../../lib/sectionValidationContext'
import { TextInput, RadioGroup } from '../../design-system/components/Input'

const EMPTY: MilitaryFormData = {
  served: false,
  branch: '',
  years: '',
}

const SERVED_OPTIONS = [
  { value: 'yes', label: 'Ja' },
  { value: 'no', label: 'Nein' },
]

// ─────────────────────────────────────────────────────────────────────────
// BACKLOG-PRE-STEP-4-001 — operator-platform path mismatch (Military)
// ─────────────────────────────────────────────────────────────────────────
// Factsheet writes:   biographical_facts.military = { served: boolean, branch, years }
// Operator writes:    biographical_facts.military_served (string 'yes'|'no'|''),
//                     biographical_facts.military_branch (string),
//                     biographical_facts.military_years (string)
//
// Two divergences:
//   1. Shape — factsheet uses a nested object; operator uses three top-level keys.
//   2. served type — factsheet stores boolean; operator stores the string 'yes'|'no'|''.
//
// STEP 4's factSheetSave.ts normalize step will need to map between the two.
// Recommended direction: factsheet writes nested-boolean (Document Definitions
// v1.3.0 canonical); operator-platform load+save adapts to read either shape
// and write the canonical going forward. Audit logged as BACKLOG-PRE-STEP-4-001.
// ─────────────────────────────────────────────────────────────────────────

export function MilitarySection() {
  const form = useForm<MilitaryFormData>({
    resolver: zodResolver(militarySchema),
    defaultValues: EMPTY,
    mode: 'onBlur',
  })

  useFactSheetAutosave<MilitaryFormData>({
    sectionId: 'military',
    data: form.watch(),
    saveFunction: saveFactSheetSection,
  })

  const validate = useCallback(() => form.trigger(), [form])
  useSetSectionValidator(validate)

  const { register, formState: { errors }, control, watch } = form
  const served = watch('served')

  return (
    <form className="space-y-6" noValidate>
      <Controller
        name="served"
        control={control}
        render={({ field, fieldState }) => (
          <RadioGroup
            id="military-served"
            label="Wehrdienst geleistet?"
            options={SERVED_OPTIONS}
            value={field.value ? 'yes' : 'no'}
            // Bridge string ↔ boolean: schema is boolean, RadioGroup values are strings.
            onChange={(e) => field.onChange(e.target.value === 'yes')}
            onBlur={field.onBlur}
            name={field.name}
            error={fieldState.error?.message}
          />
        )}
      />

      {/* Conditional fields when served=true. Values persist when flipping
          back to Nein — autosave keeps them in case user toggles forward again.
          Operator-side can ignore branch/years when served=false. */}
      {served && (
        <>
          <TextInput
            id="military-branch"
            label="Truppengattung"
            placeholder="z.B. Marine, Infanterie"
            error={errors.branch?.message}
            {...register('branch')}
          />
          <TextInput
            id="military-years"
            label="Dienstjahre"
            placeholder="1965-1967"
            inputMode="numeric"
            error={errors.years?.message}
            {...register('years')}
          />
        </>
      )}
    </form>
  )
}
