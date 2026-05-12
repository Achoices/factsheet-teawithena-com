import { useCallback } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { residencesSchema, type ResidencesFormData } from '../../lib/factSheetSchema'
import { useFactSheetAutosave } from '../../hooks/useFactSheetAutosave'
import { saveFactSheetSection } from '../../lib/factSheetSave'
import { useSetSectionValidator } from '../../lib/sectionValidationContext'
import { TextInput } from '../../design-system/components/Input'

type ResidenceEntry = ResidencesFormData['entries'][number]

const EMPTY_ENTRY: ResidenceEntry = {
  city: '',
  country: '',
  start_year: '',
  end_year: '',
}

const EMPTY_INITIAL: ResidencesFormData = { entries: [EMPTY_ENTRY] }

// No max cap on residences per CANONICAL-MAPPING-v1.0 (residencesSchema has no
// .max()). Factsheet writes residences.entries[] (nested wrapper, canonical).
// Operator-platform's legacy biographical_facts.residences string-array is
// untouched on operator side per Step J coordination — factsheet doesn't
// touch the legacy key at all.

export function ResidencesSection() {
  const form = useForm<ResidencesFormData>({
    resolver: zodResolver(residencesSchema),
    defaultValues: EMPTY_INITIAL,
    mode: 'onBlur',
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'entries',
  })

  useFactSheetAutosave<ResidencesFormData>({
    sectionId: 'residences',
    data: form.watch(),
    saveFunction: saveFactSheetSection,
  })

  const validate = useCallback(() => form.trigger(), [form])
  useSetSectionValidator(validate)

  const { register, formState: { errors } } = form
  const entryErrors = errors.entries

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
                id={`residences-${i}-city`}
                label="Stadt"
                error={entryErrors?.[i]?.city?.message}
                {...register(`entries.${i}.city`)}
              />
            </div>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="mt-8 font-body text-xs text-ink-soft hover:text-danger transition-colors duration-200 focus-ring px-2 py-1"
                aria-label={`Wohnort ${i + 1} entfernen`}
              >
                Entfernen
              </button>
            )}
          </div>
          <TextInput
            id={`residences-${i}-country`}
            label="Land"
            error={entryErrors?.[i]?.country?.message}
            {...register(`entries.${i}.country`)}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              id={`residences-${i}-start_year`}
              label="Von"
              placeholder="1985 oder ~1985"
              inputMode="numeric"
              error={entryErrors?.[i]?.start_year?.message}
              {...register(`entries.${i}.start_year`)}
            />
            <TextInput
              id={`residences-${i}-end_year`}
              label="Bis"
              placeholder="2010 oder ~2010"
              inputMode="numeric"
              error={entryErrors?.[i]?.end_year?.message}
              {...register(`entries.${i}.end_year`)}
            />
          </div>
        </div>
      ))}

      <div className="pt-4">
        <button
          type="button"
          onClick={() => append(EMPTY_ENTRY)}
          className="font-body text-sm text-ink-soft border border-rule hover:bg-bg-sunken hover:border-border-strong transition-colors duration-200 px-4 py-3 rounded inline-flex items-center gap-2 focus-ring"
        >
          <span aria-hidden="true">+</span>
          Weiteren Wohnort hinzufügen
        </button>
      </div>
    </form>
  )
}
