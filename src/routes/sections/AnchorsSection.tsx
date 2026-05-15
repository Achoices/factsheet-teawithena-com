import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { anchorsSchema, type AnchorsFormData } from '../../lib/factSheetSchema'
import { useFactSheetAutosave } from '../../hooks/useFactSheetAutosave'
import { useSaveFactSheetSection } from '../../lib/factSheetSave'
import { zodPathToRhfName } from '../../lib/zodPathToRhfName'
import { useSetSectionValidator } from '../../lib/sectionValidationContext'
import { TextInput, Textarea } from '../../design-system/components/Input'

const EMPTY: AnchorsFormData = {
  first_car_make_model: '',
  lifelong_passion: '',
  major_trip: '',
  special_possessions: '',
}

export function AnchorsSection() {
  const form = useForm<AnchorsFormData>({
    resolver: zodResolver(anchorsSchema),
    defaultValues: EMPTY,
    mode: 'onBlur',
  })

  const save = useSaveFactSheetSection()

  useFactSheetAutosave<AnchorsFormData>({
    sectionId: 'anchors',
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
        id="anchors-first_car_make_model"
        label="Erstes Auto (Marke, Modell, ca. Jahr)"
        placeholder="z.B. VW Käfer 1303 (1978)"
        error={errors.first_car_make_model?.message}
        {...register('first_car_make_model')}
      />
      <Textarea
        id="anchors-lifelong_passion"
        label="Lebenslange Leidenschaft / Hobby"
        rows={3}
        error={errors.lifelong_passion?.message}
        {...register('lifelong_passion')}
      />
      <Textarea
        id="anchors-major_trip"
        label="Wichtigste Reise / Zeit im Ausland"
        rows={3}
        error={errors.major_trip?.message}
        {...register('major_trip')}
      />
      <Textarea
        id="anchors-special_possessions"
        label="Besondere Besitztümer (die Geschichten tragen)"
        rows={4}
        error={errors.special_possessions?.message}
        {...register('special_possessions')}
      />
    </form>
  )
}
