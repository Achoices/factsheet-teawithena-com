import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { siblingsSchema, type SiblingsFormData } from '../../lib/factSheetSchema'
import { useFactSheetAutosave } from '../../hooks/useFactSheetAutosave'
import { useSaveFactSheetSection } from '../../lib/factSheetSave'
import { zodPathToRhfName } from '../../lib/zodPathToRhfName'
import { useSetSectionValidator } from '../../lib/sectionValidationContext'
import { TextInput, Textarea } from '../../design-system/components/Input'

const EMPTY: SiblingsFormData = {
  count: '',
  names: '',
}

export function SiblingsSection() {
  const form = useForm<SiblingsFormData>({
    resolver: zodResolver(siblingsSchema),
    defaultValues: EMPTY,
    mode: 'onBlur',
  })

  const save = useSaveFactSheetSection()

  useFactSheetAutosave<SiblingsFormData>({
    sectionId: 'siblings',
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

  return (
    <form className="space-y-6" noValidate>
      <TextInput
        id="siblings-count"
        label="Anzahl Geschwister"
        placeholder="z.B. 3"
        inputMode="numeric"
        error={errors.count?.message}
        {...register('count')}
      />
      <Textarea
        id="siblings-names"
        label="Namen"
        rows={4}
        helpText="Älteste zuerst. Komma-getrennt, wenn mehrere."
        error={errors.names?.message}
        {...register('names')}
      />
    </form>
  )
}
