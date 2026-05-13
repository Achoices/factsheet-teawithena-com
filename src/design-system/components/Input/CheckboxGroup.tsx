// Authored inline 2026-05-13 for Phase 3.9 Health.cognitive_adaptations.
// Sibling of RadioGroup (also inline-authored 2026-05-12 for Phase 3.2).
// BACKLOG-DESIGN-SYSTEM-007: formalize this back into operator-platform/
// design-system/ as components/checkbox.{css,html} before a third consumer
// ships.
//
// Differs from RadioGroup in three ways:
//   1. Multi-select state (string[]) rather than single string
//   2. onChange semantics: receives the WHOLE new array, never mutates the old one
//   3. role="group" on the inner div (NOT "radiogroup"); checkboxes inside a
//      <fieldset> don't take role="checkboxgroup" — there is no such role.

import { forwardRef } from 'react'
import type { FocusEventHandler } from 'react'
import { InputHelpText, InputErrorMessage, useInputAria } from './parts'
import './CheckboxGroup.css'

export interface CheckboxOption {
  value: string
  label: string
}

export interface CheckboxGroupProps {
  id: string
  label: string
  required?: boolean
  helpText?: string
  error?: string
  options: CheckboxOption[]
  /** Currently selected option values. Always treat as immutable — toggling
   * a checkbox produces a new array passed to onChange. */
  value: string[]
  /** Called with the new array on every toggle. Parent owns state. */
  onChange: (newValues: string[]) => void
  /** Fires on any individual checkbox blur. Acceptable for autosave purposes;
   * downstream debouncing handles flutter when user moves between checkboxes. */
  onBlur?: FocusEventHandler<HTMLInputElement>
  name?: string
  disabled?: boolean
}

export const CheckboxGroup = forwardRef<HTMLInputElement, CheckboxGroupProps>(function CheckboxGroup(
  { id, label, required, helpText, error, options, value, onChange, onBlur, name, disabled },
  ref,
) {
  const { helpId, errorId, ariaDescribedBy } = useInputAria(id, helpText, error)

  const toggle = (optValue: string) => {
    const next = value.includes(optValue)
      ? value.filter((v) => v !== optValue)
      : [...value, optValue]
    onChange(next)
  }

  return (
    <fieldset
      className="input-wrapper"
      aria-describedby={ariaDescribedBy}
      aria-invalid={error ? 'true' : undefined}
      disabled={disabled}
    >
      <legend className="input-label">
        {label}
        {required ? (
          <>
            <span className="input-label__required" aria-hidden="true">*</span>
            <span className="sr-only">required</span>
          </>
        ) : (
          <span className="input-label__optional">optional</span>
        )}
      </legend>

      <div className="checkbox-group" role="group" aria-labelledby={`${id}-legend`}>
        {options.map((opt, i) => {
          const optionId = `${id}-${opt.value || `opt-${i}`}`
          const isChecked = value.includes(opt.value)
          return (
            <label
              key={opt.value}
              htmlFor={optionId}
              className={['checkbox-option', disabled ? 'checkbox-option--disabled' : null]
                .filter(Boolean)
                .join(' ')}
            >
              <input
                id={optionId}
                ref={i === 0 ? ref : undefined}
                type="checkbox"
                name={name}
                value={opt.value}
                checked={isChecked}
                onChange={() => toggle(opt.value)}
                onBlur={onBlur}
                disabled={disabled}
                className="checkbox-input"
              />
              <span className="checkbox-box" aria-hidden="true" />
              <span className="checkbox-label">{opt.label}</span>
            </label>
          )
        })}
      </div>

      {error && errorId && <InputErrorMessage id={errorId}>{error}</InputErrorMessage>}
      {helpText && !error && helpId && <InputHelpText id={helpId}>{helpText}</InputHelpText>}
    </fieldset>
  )
})
