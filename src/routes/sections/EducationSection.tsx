import { useCallback } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { educationSchema, type EducationFormData } from '../../lib/factSheetSchema'
import { useFactSheetAutosave } from '../../hooks/useFactSheetAutosave'
import { useFactSheetInitialData } from '../../hooks/useFactSheetInitialData'
import { useSaveFactSheetSection } from '../../lib/factSheetSave'
import { denormalizeEducation } from '../../lib/denormalizeSection'
import { zodPathToRhfName } from '../../lib/zodPathToRhfName'
import { useSetSectionValidator } from '../../lib/sectionValidationContext'
import { TextInput } from '../../design-system/components/Input'

const EMPTY_ENTRY = { institution: '', field: '', start_year: '', end_year: '' }
const EMPTY_INITIAL: EducationFormData = { entries: [EMPTY_ENTRY] }

export function EducationSection() {
  const initialValues = useFactSheetInitialData('education', denormalizeEducation, EMPTY_INITIAL)
  const form = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  })

  // useFieldArray drives dynamic rows. Default 1 empty row so the section
  // never appears blank.
  //
  // STEP 4 LOAD-PATH CONSTRAINT: when the load path returns entries===undefined
  // or [], it MUST ensure at least one empty entry is present before
  // form.reset() — otherwise fields.map() renders nothing and the user sees
  // an empty section with no way to start. Pattern:
  //   const loaded = response.entries ?? []
  //   form.reset({ entries: loaded.length > 0 ? loaded : [EMPTY_ENTRY] })
  // This same constraint applies to Sections 08 / 09 / 10 when they get
  // their useFieldArray treatment in subsequent STEP 3.x commits.
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'entries',
  })

  const save = useSaveFactSheetSection()

  useFactSheetAutosave<EducationFormData>({
    sectionId: 'education',
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
                id={`edu-${i}-institution`}
                label="Schule, Hochschule oder Ausbildungsstätte"
                error={entryErrors?.[i]?.institution?.message}
                {...register(`entries.${i}.institution`)}
              />
            </div>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="mt-8 font-body text-xs text-ink-soft hover:text-danger transition-colors duration-200 focus-ring px-2 py-1"
                aria-label={`Eintrag ${i + 1} entfernen`}
              >
                Entfernen
              </button>
            )}
          </div>
          <TextInput
            id={`edu-${i}-field`}
            label="Fach oder Schwerpunkt"
            error={entryErrors?.[i]?.field?.message}
            {...register(`entries.${i}.field`)}
          />
          <div className="grid grid-cols-2 gap-4 form-row--aligned-labels">
            <TextInput
              id={`edu-${i}-start_year`}
              label="Von"
              placeholder="1948 oder ~1948"
              inputMode="numeric"
              error={entryErrors?.[i]?.start_year?.message}
              {...register(`entries.${i}.start_year`)}
            />
            <TextInput
              id={`edu-${i}-end_year`}
              label="Bis"
              placeholder="1956 oder ~1956"
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
          Weitere Ausbildung hinzufügen
        </button>
      </div>
    </form>
  )
}
