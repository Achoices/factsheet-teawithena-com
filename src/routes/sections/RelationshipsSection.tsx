import { useCallback } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { relationshipsSchema, type RelationshipsFormData } from '../../lib/factSheetSchema'
import { useFactSheetAutosave } from '../../hooks/useFactSheetAutosave'
import { saveFactSheetSection } from '../../lib/factSheetSave'
import { useSetSectionValidator } from '../../lib/sectionValidationContext'
import { TextInput, RadioGroup } from '../../design-system/components/Input'

const MAX_MARRIAGES = 3
const MAX_CHILDREN = 5

type Marriage = RelationshipsFormData['marriages'][number]
type Child = RelationshipsFormData['children'][number]

// Default to 'marriage' + 'ongoing' so the form passes Zod's required enums
// before the user touches anything. Without these, form.trigger() (used by
// SectionPage to gate Speichern und weiter) would block on a never-touched
// empty marriage row.
const EMPTY_MARRIAGE: Marriage = {
  partner: '',
  year: '',
  location: '',
  dissolution_type: 'ongoing',
  dissolution_year: '',
  relationship_type: 'marriage',
}

const EMPTY_CHILD: Child = {
  name: '',
  birth_year: '',
}

const EMPTY_INITIAL: RelationshipsFormData = {
  marriages: [EMPTY_MARRIAGE],
  children: [EMPTY_CHILD],
}

const RELATIONSHIP_TYPE_OPTIONS = [
  { value: 'marriage', label: 'Ehe' },
  { value: 'partnership', label: 'Partnerschaft' },
  { value: 'civil_partnership', label: 'Eingetragene Partnerschaft' },
]

const DISSOLUTION_TYPE_OPTIONS = [
  { value: 'ongoing', label: 'Andauernd' },
  { value: 'divorced', label: 'Geschieden' },
  { value: 'widowed', label: 'Verwitwet' },
]

// CONDITIONAL UI vs CANONICAL EMISSION:
// The `dissolution_year` input is hidden when dissolution_type === 'ongoing'.
// RHF default shouldUnregister: false keeps the form state value across the
// toggle — if the user flips back to divorced/widowed, the value reappears.
// On save, normalizeRelationships (in normalizeSection.ts) forces
// dissolution_year to {value:null,approximate:false} when dissolution_type is
// 'ongoing' regardless of form state — semantic truth wins over user input.

export function RelationshipsSection() {
  const form = useForm<RelationshipsFormData>({
    resolver: zodResolver(relationshipsSchema),
    defaultValues: EMPTY_INITIAL,
    mode: 'onBlur',
  })

  const {
    fields: marriageFields,
    append: appendMarriage,
    remove: removeMarriage,
  } = useFieldArray({ control: form.control, name: 'marriages' })

  const {
    fields: childFields,
    append: appendChild,
    remove: removeChild,
  } = useFieldArray({ control: form.control, name: 'children' })

  useFactSheetAutosave<RelationshipsFormData>({
    sectionId: 'relationships',
    data: form.watch(),
    saveFunction: saveFactSheetSection,
  })

  const validate = useCallback(() => form.trigger(), [form])
  useSetSectionValidator(validate)

  const { register, control, formState: { errors }, watch } = form
  const marriageErrors = errors.marriages
  const childErrors = errors.children

  const atMaxMarriages = marriageFields.length >= MAX_MARRIAGES
  const atMaxChildren = childFields.length >= MAX_CHILDREN

  return (
    <form className="space-y-10" noValidate>
      {/* Marriages */}
      <div className="space-y-6">
        <h2 className="font-display text-[1.125rem] text-ink font-light tracking-tight border-b border-rule pb-2">
          Ehen / Beziehungen
        </h2>
        {marriageFields.map((field, i) => {
          const dissolutionType = watch(`marriages.${i}.dissolution_type`)
          const isOngoing = dissolutionType === 'ongoing'
          return (
            <div
              key={field.id}
              className={i > 0 ? 'pt-8 border-t border-rule space-y-4' : 'space-y-4'}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <TextInput
                    id={`marriages-${i}-partner`}
                    label="Partner / Partnerin"
                    error={marriageErrors?.[i]?.partner?.message}
                    {...register(`marriages.${i}.partner`)}
                  />
                </div>
                {marriageFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMarriage(i)}
                    className="mt-8 font-body text-xs text-ink-soft hover:text-danger transition-colors duration-200 focus-ring px-2 py-1"
                    aria-label={`Beziehung ${i + 1} entfernen`}
                  >
                    Entfernen
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  id={`marriages-${i}-year`}
                  label="Beginn (Jahr)"
                  placeholder="1948 oder ~1948"
                  inputMode="numeric"
                  error={marriageErrors?.[i]?.year?.message}
                  {...register(`marriages.${i}.year`)}
                />
                <TextInput
                  id={`marriages-${i}-location`}
                  label="Ort der Hochzeit"
                  error={marriageErrors?.[i]?.location?.message}
                  {...register(`marriages.${i}.location`)}
                />
              </div>

              <Controller
                name={`marriages.${i}.relationship_type`}
                control={control}
                render={({ field: rtField, fieldState }) => (
                  <RadioGroup
                    id={`marriages-${i}-relationship-type`}
                    label="Art der Beziehung"
                    options={RELATIONSHIP_TYPE_OPTIONS}
                    value={rtField.value}
                    onChange={rtField.onChange}
                    onBlur={rtField.onBlur}
                    name={rtField.name}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name={`marriages.${i}.dissolution_type`}
                control={control}
                render={({ field: dtField, fieldState }) => (
                  <RadioGroup
                    id={`marriages-${i}-dissolution-type`}
                    label="Status"
                    options={DISSOLUTION_TYPE_OPTIONS}
                    value={dtField.value}
                    onChange={dtField.onChange}
                    onBlur={dtField.onBlur}
                    name={dtField.name}
                    error={fieldState.error?.message}
                  />
                )}
              />

              {!isOngoing && (
                <TextInput
                  id={`marriages-${i}-dissolution_year`}
                  label="Jahr der Auflösung / Tod"
                  placeholder="1995 oder ~1995"
                  inputMode="numeric"
                  helpText="Jahr der Scheidung oder des Todes des Partners."
                  error={marriageErrors?.[i]?.dissolution_year?.message}
                  {...register(`marriages.${i}.dissolution_year`)}
                />
              )}
            </div>
          )
        })}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => !atMaxMarriages && appendMarriage(EMPTY_MARRIAGE)}
            disabled={atMaxMarriages}
            title={atMaxMarriages ? 'Maximal 3 Beziehungen' : undefined}
            className={[
              'font-body text-sm border border-rule px-4 py-3 rounded inline-flex items-center gap-2 focus-ring transition-colors duration-200',
              atMaxMarriages
                ? 'text-muted-soft cursor-not-allowed opacity-60'
                : 'text-ink-soft hover:bg-bg-sunken hover:border-border-strong',
            ].join(' ')}
          >
            <span aria-hidden="true">+</span>
            Weitere Ehe hinzufügen
          </button>
        </div>
      </div>

      {/* Children */}
      <div className="space-y-6 pt-4">
        <h2 className="font-display text-[1.125rem] text-ink font-light tracking-tight border-b border-rule pb-2">
          Kinder
        </h2>

        {childFields.map((field, i) => (
          <div
            key={field.id}
            className={i > 0 ? 'pt-6 border-t border-rule' : ''}
          >
            <div className="grid grid-cols-[2fr,1fr,auto] gap-4 items-start">
              <TextInput
                id={`children-${i}-name`}
                label={`Kind ${i + 1} — Name`}
                error={childErrors?.[i]?.name?.message}
                {...register(`children.${i}.name`)}
              />
              <TextInput
                id={`children-${i}-birth_year`}
                label="Geburtsjahr"
                placeholder="1970 oder ~1970"
                inputMode="numeric"
                error={childErrors?.[i]?.birth_year?.message}
                {...register(`children.${i}.birth_year`)}
              />
              {childFields.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeChild(i)}
                  className="mt-8 font-body text-xs text-ink-soft hover:text-danger transition-colors duration-200 focus-ring px-2 py-1"
                  aria-label={`Kind ${i + 1} entfernen`}
                >
                  Entfernen
                </button>
              ) : (
                <span aria-hidden="true" />
              )}
            </div>
          </div>
        ))}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => !atMaxChildren && appendChild(EMPTY_CHILD)}
            disabled={atMaxChildren}
            title={atMaxChildren ? 'Maximal 5 Kinder' : undefined}
            className={[
              'font-body text-sm border border-rule px-4 py-3 rounded inline-flex items-center gap-2 focus-ring transition-colors duration-200',
              atMaxChildren
                ? 'text-muted-soft cursor-not-allowed opacity-60'
                : 'text-ink-soft hover:bg-bg-sunken hover:border-border-strong',
            ].join(' ')}
          >
            <span aria-hidden="true">+</span>
            Weiteres Kind hinzufügen
          </button>
        </div>
      </div>
    </form>
  )
}
