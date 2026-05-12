// Authored inline 2026-05-12 for Phase 3.2 (Section 02 family_context).
// Sibling of the Input V1 vendor (input.css/.html @ ai_agents commit 22caafd).
// BACKLOG-DESIGN-SYSTEM-008: formalize back into operator-platform/design-system/
// as components/radio.{css,html} before a third consumer ships.

import { forwardRef } from 'react'
import type { ChangeEventHandler, FocusEventHandler } from 'react'
import { InputHelpText, InputErrorMessage, useInputAria } from './parts'
import './RadioGroup.css'

export interface RadioOption {
  value: string
  label: string
}

export interface RadioGroupProps {
  id: string
  label: string
  required?: boolean
  helpText?: string
  error?: string
  options: RadioOption[]
  /** The currently selected option value. Empty string = nothing selected. */
  value?: string
  /** Native change handler; receives the chosen radio's value via e.target.value. */
  onChange?: ChangeEventHandler<HTMLInputElement>
  onBlur?: FocusEventHandler<HTMLInputElement>
  /** RHF supplies this via register(); must match across all radios in the group. */
  name: string
  disabled?: boolean
}

/**
 * Native radio group styled to match Input V1 (clay-deep dots, accent ring on
 * focus, danger border on aria-invalid). Hidden native inputs receive
 * keyboard + click events; visible "dots" are pure presentational siblings.
 *
 * Ref is forwarded to the FIRST radio so react-hook-form's register() ref
 * (which by convention points at the first input) lands somewhere sensible
 * for autofocus / scroll-to-error scenarios.
 */
export const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(function RadioGroup(
  { id, label, required, helpText, error, options, value, onChange, onBlur, name, disabled },
  ref,
) {
  const { helpId, errorId, ariaDescribedBy } = useInputAria(id, helpText, error)
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

      <div className="radio-group" role="radiogroup" aria-labelledby={`${id}-legend`}>
        {options.map((opt, i) => {
          const optionId = `${id}-${opt.value || `opt-${i}`}`
          const isChecked = value === opt.value
          return (
            <label
              key={opt.value}
              htmlFor={optionId}
              className={['radio-option', disabled ? 'radio-option--disabled' : null]
                .filter(Boolean)
                .join(' ')}
            >
              <input
                id={optionId}
                ref={i === 0 ? ref : undefined}
                type="radio"
                name={name}
                value={opt.value}
                checked={isChecked}
                onChange={onChange}
                onBlur={onBlur}
                disabled={disabled}
                className="radio-input"
              />
              <span className="radio-dot" aria-hidden="true" />
              <span className="radio-label">{opt.label}</span>
            </label>
          )
        })}
      </div>

      {error && errorId && <InputErrorMessage id={errorId}>{error}</InputErrorMessage>}
      {helpText && !error && helpId && <InputHelpText id={helpId}>{helpText}</InputHelpText>}
    </fieldset>
  )
})
