import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  fatherSchema,
  familyContextSchema,
  type FatherFormData,
  type FamilyContextFormData,
} from '../../lib/factSheetSchema'
import { useFactSheetAutosave } from '../../hooks/useFactSheetAutosave'
import { useFactSheetInitialData } from '../../hooks/useFactSheetInitialData'
import { useSaveFactSheetSection } from '../../lib/factSheetSave'
import { denormalizeFather, denormalizeFamilyContext } from '../../lib/denormalizeSection'
import { useSetSectionValidator } from '../../lib/sectionValidationContext'
import { zodPathToRhfName } from '../../lib/zodPathToRhfName'
import { TextInput, Textarea, RadioGroup } from '../../design-system/components/Input'

const EMPTY_FATHER: FatherFormData = {
  name: '',
  place_of_origin: '',
  birth_year: '',
  death_year: '',
  profession: '',
}

const EMPTY_FAMILY_CONTEXT: FamilyContextFormData = {
  most_influential_parent: '',
  parent_relationship_note: '',
}

const INFLUENCE_OPTIONS = [
  { value: 'father', label: 'Vater' },
  { value: 'mother', label: 'Mutter' },
  { value: 'both', label: 'Beide' },
  { value: 'neither', label: 'Keiner' },
]

export function FatherSection() {
  const initialFather = useFactSheetInitialData('father', denormalizeFather, EMPTY_FATHER)
  const fatherForm = useForm<FatherFormData>({
    resolver: zodResolver(fatherSchema),
    defaultValues: initialFather,
    mode: 'onBlur',
  })

  const initialFamilyContext = useFactSheetInitialData('family_context', denormalizeFamilyContext, EMPTY_FAMILY_CONTEXT)
  const familyContextForm = useForm<FamilyContextFormData>({
    resolver: zodResolver(familyContextSchema),
    defaultValues: initialFamilyContext,
    mode: 'onBlur',
  })

  // Both forms autosave independently. Status indicator (single, shared via
  // AutosaveStatusContext) reflects whichever fired most recently.
  // STEP 4 attention: when saveFunction becomes real, an error in one form
  // followed by success in the other can mask the failure visually. Plan to
  // refactor AutosaveStatusContext to be section-keyed at that point.
  const save = useSaveFactSheetSection()
  useFactSheetAutosave<FatherFormData>({
    sectionId: 'father',
    data: fatherForm.watch(),
    saveFunction: save,
    onValidationError: (errors) => {
      errors.forEach((err) => {
        const name = zodPathToRhfName(err.path)
        if (name) fatherForm.setError(name as never, { type: 'server', message: err.message })
      })
    },
  })
  useFactSheetAutosave<FamilyContextFormData>({
    sectionId: 'family_context',
    data: familyContextForm.watch(),
    saveFunction: save,
    onValidationError: (errors) => {
      errors.forEach((err) => {
        const name = zodPathToRhfName(err.path)
        if (name) familyContextForm.setError(name as never, { type: 'server', message: err.message })
      })
    },
  })

  // Combined validator — SectionPage's "Speichern und weiter" calls this
  // before navigating to Section 03. Both forms must pass; if either fails,
  // RHF surfaces field errors and nav is blocked.
  const validate = useCallback(async () => {
    const [a, b] = await Promise.all([
      fatherForm.trigger(),
      familyContextForm.trigger(),
    ])
    return a && b
  }, [fatherForm, familyContextForm])
  useSetSectionValidator(validate)

  const fatherErrors = fatherForm.formState.errors
  const fcErrors = familyContextForm.formState.errors
  const influenceValue = familyContextForm.watch('most_influential_parent')

  return (
    <div className="space-y-12">
      {/* ---- Father fields ---- */}
      <form className="space-y-6" noValidate>
        <TextInput
          id="father-name"
          label="Name"
          required
          error={fatherErrors.name?.message}
          {...fatherForm.register('name')}
        />
        <TextInput
          id="father-place_of_origin"
          label="Herkunftsort"
          error={fatherErrors.place_of_origin?.message}
          {...fatherForm.register('place_of_origin')}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            id="father-birth_year"
            label="Geburtsjahr"
            placeholder="1925 oder ~1925"
            inputMode="numeric"
            error={fatherErrors.birth_year?.message}
            {...fatherForm.register('birth_year')}
          />
          <TextInput
            id="father-death_year"
            label="Sterbejahr (falls verstorben)"
            placeholder="~1998"
            inputMode="numeric"
            helpText="Leer lassen, falls noch am Leben"
            error={fatherErrors.death_year?.message}
            {...fatherForm.register('death_year')}
          />
        </div>
        <TextInput
          id="father-profession"
          label="Beruf"
          error={fatherErrors.profession?.message}
          {...fatherForm.register('profession')}
        />
      </form>

      {/* ---- Visual divider into the inline family_context block ---- */}
      <div className="pt-2 border-t border-rule">
        <p className="eyebrow mt-6 mb-4">Familienkontext</p>
      </div>

      {/* ---- Family context (inline) ---- */}
      <form className="space-y-6" noValidate>
        <RadioGroup
          id="family-most_influential_parent"
          label="Welcher Elternteil hatte den größten Einfluss?"
          options={INFLUENCE_OPTIONS}
          value={influenceValue}
          error={fcErrors.most_influential_parent?.message}
          {...familyContextForm.register('most_influential_parent')}
        />
        <Textarea
          id="family-parent_relationship_note"
          label="Wenn du magst, schreibe ein paar Sätze dazu"
          rows={4}
          error={fcErrors.parent_relationship_note?.message}
          {...familyContextForm.register('parent_relationship_note')}
        />
      </form>
    </div>
  )
}
