import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { InputLabel, InputHelpText, InputErrorMessage, useInputAria } from './parts'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string
  label: string
  required?: boolean
  helpText?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id, label, required, helpText, error, className, ...rest },
  ref,
) {
  const { helpId, errorId, ariaDescribedBy } = useInputAria(id, helpText, error)
  const classes = ['input', 'input--textarea', error ? 'input--error' : null, className]
    .filter(Boolean)
    .join(' ')
  return (
    <div className="input-wrapper">
      <InputLabel htmlFor={id} required={required}>{label}</InputLabel>
      <textarea
        id={id}
        ref={ref}
        className={classes}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={ariaDescribedBy}
        {...rest}
      />
      {error && errorId && <InputErrorMessage id={errorId}>{error}</InputErrorMessage>}
      {helpText && !error && helpId && <InputHelpText id={helpId}>{helpText}</InputHelpText>}
    </div>
  )
})
