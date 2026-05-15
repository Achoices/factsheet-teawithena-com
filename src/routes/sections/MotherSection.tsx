import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motherSchema, type MotherFormData } from '../../lib/factSheetSchema'
import { useFactSheetAutosave } from '../../hooks/useFactSheetAutosave'
import { useSaveFactSheetSection } from '../../lib/factSheetSave'
import { zodPathToRhfName } from '../../lib/zodPathToRhfName'
import { useSetSectionValidator } from '../../lib/sectionValidationContext'
import { TextInput } from '../../design-system/components/Input'

const EMPTY_MOTHER: MotherFormData = {
  name: '',
  place_of_origin: '',
  birth_year: '',
  death_year: '',
  profession: '',
}

export function MotherSection() {
  const form = useForm<MotherFormData>({
    resolver: zodResolver(motherSchema),
    defaultValues: EMPTY_MOTHER,
    mode: 'onBlur',
  })

  const save = useSaveFactSheetSection()

  useFactSheetAutosave<MotherFormData>({
    sectionId: 'mother',
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

  const errors = form.formState.errors

  return (
    <form className="space-y-6" noValidate>
      <TextInput
        id="mother-name"
        label="Name"
        required
        error={errors.name?.message}
        {...form.register('name')}
      />
      <TextInput
        id="mother-place_of_origin"
        label="Herkunftsort"
        error={errors.place_of_origin?.message}
        {...form.register('place_of_origin')}
      />
      <div className="grid grid-cols-2 gap-4">
        <TextInput
          id="mother-birth_year"
          label="Geburtsjahr"
          placeholder="1928 oder ~1928"
          inputMode="numeric"
          error={errors.birth_year?.message}
          {...form.register('birth_year')}
        />
        <TextInput
          id="mother-death_year"
          label="Sterbejahr (falls verstorben)"
          placeholder="~2005"
          inputMode="numeric"
          helpText="Leer lassen, falls noch am Leben"
          error={errors.death_year?.message}
          {...form.register('death_year')}
        />
      </div>
      <TextInput
        id="mother-profession"
        label="Beruf"
        error={errors.profession?.message}
        {...form.register('profession')}
      />
    </form>
  )
}
