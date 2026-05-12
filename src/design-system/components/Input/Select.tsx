import { forwardRef } from 'react'
import type { ReactNode, SelectHTMLAttributes } from 'react'
import { InputLabel, InputHelpText, InputErrorMessage, useInputAria } from './parts'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  label: string
  required?: boolean
  helpText?: string
  error?: string
  /** Native <option> children (or <optgroup>). */
  children: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, required, helpText, error, className, children, ...rest },
  ref,
) {
  const { helpId, errorId, ariaDescribedBy } = useInputAria(id, helpText, error)
  const classes = ['input', 'input--select', error ? 'input--error' : null, className]
    .filter(Boolean)
    .join(' ')
  return (
    <div className="input-wrapper">
      <InputLabel htmlFor={id} required={required}>{label}</InputLabel>
      <select
        id={id}
        ref={ref}
        className={classes}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={ariaDescribedBy}
        {...rest}
      >
        {children}
      </select>
      {error && errorId && <InputErrorMessage id={errorId}>{error}</InputErrorMessage>}
      {helpText && !error && helpId && <InputHelpText id={helpId}>{helpText}</InputHelpText>}
    </div>
  )
})
