import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { subjectSchema, type SubjectFormData } from '../../lib/factSheetSchema'
import { useFactSheetAutosave } from '../../hooks/useFactSheetAutosave'
import { useFactSheetInitialData } from '../../hooks/useFactSheetInitialData'
import { useSaveFactSheetSection } from '../../lib/factSheetSave'
import { useSetSectionValidator } from '../../lib/sectionValidationContext'
import { zodPathToRhfName } from '../../lib/zodPathToRhfName'
import { denormalizeSubject } from '../../lib/denormalizeSection'
import { TextInput, Textarea } from '../../design-system/components/Input'

const EMPTY: SubjectFormData = {
  full_name: '',
  birth_name: '',
  birth_year: '',
  birth_month: '',
  birth_day: '',
  place_of_birth: '',
  nationality: '',
  mother_tongue: '',
  subject_character_sketch: '',
}

export function SubjectSection() {
  const initialValues = useFactSheetInitialData('subject', denormalizeSubject, EMPTY)
  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  })
  const { register, formState: { errors } } = form

  // watch() returns the live form values; useFactSheetAutosave debounces on
  // content change and pushes status into AutosaveStatusContext.
  const watched = form.watch()
  const save = useSaveFactSheetSection()
  useFactSheetAutosave<SubjectFormData>({
    sectionId: 'subject',
    data: watched,
    saveFunction: save,
    onValidationError: (errors) => {
      errors.forEach((err) => {
        const name = zodPathToRhfName(err.path)
        if (name) form.setError(name as never, { type: 'server', message: err.message })
      })
    },
  })

  // STEP 3.2: register a validator so SectionPage's "Speichern und weiter"
  // blocks navigation when required fields are empty / invalid.
  const validate = useCallback(() => form.trigger(), [form])
  useSetSectionValidator(validate)

  return (
    <form className="space-y-6" noValidate>
      <TextInput
        id="full_name"
        label="Vollständiger Name"
        required
        error={errors.full_name?.message}
        {...register('full_name')}
      />

      <TextInput
        id="birth_name"
        label="Geburtsname (falls abweichend)"
        error={errors.birth_name?.message}
        {...register('birth_name')}
      />

      <div className="grid grid-cols-3 gap-4">
        <TextInput
          id="birth_year"
          label="Geburtsjahr"
          required
          inputMode="numeric"
          placeholder="1936"
          helpText="Vier Ziffern"
          error={errors.birth_year?.message}
          {...register('birth_year')}
        />
        <TextInput
          id="birth_month"
          label="Monat"
          inputMode="numeric"
          placeholder="3"
          error={errors.birth_month?.message}
          {...register('birth_month')}
        />
        <TextInput
          id="birth_day"
          label="Tag"
          inputMode="numeric"
          placeholder="15"
          error={errors.birth_day?.message}
          {...register('birth_day')}
        />
      </div>

      <TextInput
        id="place_of_birth"
        label="Geburtsort"
        required
        placeholder="Stadt, Land"
        error={errors.place_of_birth?.message}
        {...register('place_of_birth')}
      />

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          id="nationality"
          label="Nationalität"
          error={errors.nationality?.message}
          {...register('nationality')}
        />
        <TextInput
          id="mother_tongue"
          label="Muttersprache"
          error={errors.mother_tongue?.message}
          {...register('mother_tongue')}
        />
      </div>

      <Textarea
        id="subject_character_sketch"
        label="Persönlichkeit in eigenen Worten"
        helpText="Was macht diese Person aus? Ein paar Sätze."
        error={errors.subject_character_sketch?.message}
        rows={5}
        {...register('subject_character_sketch')}
      />
    </form>
  )
}
