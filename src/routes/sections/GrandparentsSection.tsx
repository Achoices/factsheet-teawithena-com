import { useCallback } from 'react'
import { useForm, type UseFormRegister, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { grandparentsSchema, type GrandparentsFormData } from '../../lib/factSheetSchema'
import { useFactSheetAutosave } from '../../hooks/useFactSheetAutosave'
import { saveFactSheetSection } from '../../lib/factSheetSave'
import { useSetSectionValidator } from '../../lib/sectionValidationContext'
import { TextInput } from '../../design-system/components/Input'

type LineageKey =
  | 'paternal_grandfather'
  | 'paternal_grandmother'
  | 'maternal_grandfather'
  | 'maternal_grandmother'

const EMPTY_ENTRY = { name: '', birth_year: '', death_year: '' }

const EMPTY: GrandparentsFormData = {
  paternal_grandfather: EMPTY_ENTRY,
  paternal_grandmother: EMPTY_ENTRY,
  maternal_grandfather: EMPTY_ENTRY,
  maternal_grandmother: EMPTY_ENTRY,
}

interface GrandparentEntryProps {
  keyName: LineageKey
  title: string
  birthPlaceholder: string
  deathPlaceholder: string
  register: UseFormRegister<GrandparentsFormData>
  errors: FieldErrors<GrandparentsFormData>
}

function GrandparentEntry({
  keyName,
  title,
  birthPlaceholder,
  deathPlaceholder,
  register,
  errors,
}: GrandparentEntryProps) {
  const entryErrors = errors[keyName]
  return (
    <div className="space-y-4">
      <h3 className="font-display text-[17px] text-ink mb-1">{title}</h3>
      <TextInput
        id={`${keyName}-name`}
        label="Name"
        error={entryErrors?.name?.message}
        {...register(`${keyName}.name`)}
      />
      <div className="grid grid-cols-2 gap-4">
        <TextInput
          id={`${keyName}-birth_year`}
          label="Geburtsjahr"
          placeholder={birthPlaceholder}
          inputMode="numeric"
          error={entryErrors?.birth_year?.message}
          {...register(`${keyName}.birth_year`)}
        />
        <TextInput
          id={`${keyName}-death_year`}
          label="Sterbejahr (falls verstorben)"
          placeholder={deathPlaceholder}
          inputMode="numeric"
          helpText="Leer lassen, falls noch am Leben"
          error={entryErrors?.death_year?.message}
          {...register(`${keyName}.death_year`)}
        />
      </div>
    </div>
  )
}

export function GrandparentsSection() {
  const form = useForm<GrandparentsFormData>({
    resolver: zodResolver(grandparentsSchema),
    defaultValues: EMPTY,
    mode: 'onBlur',
  })

  useFactSheetAutosave<GrandparentsFormData>({
    sectionId: 'grandparents',
    data: form.watch(),
    saveFunction: saveFactSheetSection,
  })

  const validate = useCallback(() => form.trigger(), [form])
  useSetSectionValidator(validate)

  const { register, formState: { errors } } = form

  return (
    <form className="space-y-10" noValidate>
      {/* Paternal lineage */}
      <section className="space-y-8">
        <p className="eyebrow eyebrow-ink">Väterlicherseits</p>
        <GrandparentEntry
          keyName="paternal_grandfather"
          title="Großvater väterlicherseits"
          birthPlaceholder="1898 oder ~1898"
          deathPlaceholder="~1978"
          register={register}
          errors={errors}
        />
        <GrandparentEntry
          keyName="paternal_grandmother"
          title="Großmutter väterlicherseits"
          birthPlaceholder="1902 oder ~1902"
          deathPlaceholder="~1985"
          register={register}
          errors={errors}
        />
      </section>

      {/* Visual divider between lineages */}
      <div className="border-t border-rule" />

      {/* Maternal lineage */}
      <section className="space-y-8">
        <p className="eyebrow eyebrow-ink">Mütterlicherseits</p>
        <GrandparentEntry
          keyName="maternal_grandfather"
          title="Großvater mütterlicherseits"
          birthPlaceholder="1895 oder ~1895"
          deathPlaceholder="~1972"
          register={register}
          errors={errors}
        />
        <GrandparentEntry
          keyName="maternal_grandmother"
          title="Großmutter mütterlicherseits"
          birthPlaceholder="1900 oder ~1900"
          deathPlaceholder="~1980"
          register={register}
          errors={errors}
        />
      </section>
    </form>
  )
}
