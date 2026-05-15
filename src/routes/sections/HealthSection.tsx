import { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { healthSchema, type HealthFormData } from '../../lib/factSheetSchema'
import { useFactSheetAutosave } from '../../hooks/useFactSheetAutosave'
import { useSaveFactSheetSection } from '../../lib/factSheetSave'
import { zodPathToRhfName } from '../../lib/zodPathToRhfName'
import { useSetSectionValidator } from '../../lib/sectionValidationContext'
import { TextInput, Textarea, RadioGroup, CheckboxGroup } from '../../design-system/components/Input'

const EMPTY: HealthFormData = {
  pacing: '',
  cognitive_adaptations: [],
  max_session_minutes: '',
  health_notes: '',
}

const PACING_OPTIONS = [
  { value: 'full_pace', label: 'Volles Tempo' },
  { value: 'moderate', label: 'Mittleres Tempo, gelegentliche Pausen' },
  { value: 'slow_with_breaks', label: 'Langsam, mit regelmäßigen Pausen' },
]

// Canonical 5-value enum per CANONICAL-MAPPING-v1.0. Operator-platform's UI
// currently emits a 3-value legacy enum; coordinated relabel tracked under
// BACKLOG-HEALTH-COGNITIVE-ADAPTATIONS-001 and must ship before Step 6
// (customer-facing save endpoint).
const COGNITIVE_ADAPTATION_OPTIONS = [
  { value: 'short_sentences', label: 'Kurze Sätze verwenden' },
  { value: 'repeat_key_points', label: 'Wichtige Punkte wiederholen' },
  { value: 'visual_aids', label: 'Visuelle Hilfen (Fotos, Notizen)' },
  { value: 'written_summaries', label: 'Schriftliche Zusammenfassungen' },
  { value: 'extra_time', label: 'Mehr Zeit, wenn nötig' },
]

export function HealthSection() {
  const form = useForm<HealthFormData>({
    resolver: zodResolver(healthSchema),
    defaultValues: EMPTY,
    mode: 'onBlur',
  })

  const save = useSaveFactSheetSection()

  useFactSheetAutosave<HealthFormData>({
    sectionId: 'health',
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

  const { register, control, formState: { errors } } = form

  return (
    <form className="space-y-8" noValidate>
      <Controller
        name="pacing"
        control={control}
        render={({ field, fieldState }) => (
          <RadioGroup
            id="health-pacing"
            label="Tempo bei den Interviews"
            helpText="Wie viel Zeit pro Sitzung ist angenehm?"
            options={PACING_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        name="cognitive_adaptations"
        control={control}
        render={({ field, fieldState }) => (
          <CheckboxGroup
            id="health-cognitive_adaptations"
            label="Anpassungen für klare Gespräche"
            helpText="Mehrfachauswahl möglich"
            options={COGNITIVE_ADAPTATION_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            error={fieldState.error?.message}
          />
        )}
      />

      <TextInput
        id="health-max_session_minutes"
        label="Maximale Sitzungsdauer (Minuten)"
        placeholder="90"
        helpText="Standard: 90 Minuten"
        inputMode="numeric"
        error={errors.max_session_minutes?.message}
        {...register('max_session_minutes')}
      />

      <Textarea
        id="health-health_notes"
        label="Weitere Hinweise"
        helpText="Optional — alles, was Interviewer wissen sollten"
        rows={5}
        error={errors.health_notes?.message}
        {...register('health_notes')}
      />
    </form>
  )
}
