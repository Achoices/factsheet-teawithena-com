import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { InputLabel, InputHelpText, InputErrorMessage, useInputAria } from './parts'

type NativeTextLikeType = 'text' | 'email' | 'tel' | 'url' | 'password' | 'search'

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  id: string
  label: string
  required?: boolean
  helpText?: string
  error?: string
  type?: NativeTextLikeType
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { id, label, required, helpText, error, type = 'text', className, ...rest },
  ref,
) {
  const { helpId, errorId, ariaDescribedBy } = useInputAria(id, helpText, error)
  const classes = ['input', 'input--text', error ? 'input--error' : null, className]
    .filter(Boolean)
    .join(' ')
  return (
    <div className="input-wrapper">
      <InputLabel htmlFor={id} required={required}>{label}</InputLabel>
      <input
        id={id}
        ref={ref}
        type={type}
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
