// Internal building blocks for the Input v1 family.
// Mirrors the wrapper structure from operator-platform/design-system/components/input.html
// (commit 22caafd) lines 270-340. Use through TextInput / Textarea / DateInput / Select —
// not exported from index.ts because the variants are the public API.

import type { ReactNode } from 'react'

interface InputLabelProps {
  htmlFor: string
  required?: boolean
  children: ReactNode
}

export function InputLabel({ htmlFor, required, children }: InputLabelProps) {
  return (
    <label className="input-label" htmlFor={htmlFor}>
      {children}
      {required ? (
        <>
          <span className="input-label__required" aria-hidden="true">*</span>
          <span className="sr-only">required</span>
        </>
      ) : (
        <span className="input-label__optional">optional</span>
      )}
    </label>
  )
}

export function InputHelpText({ id, children }: { id: string; children: ReactNode }) {
  return <p className="input-help" id={id}>{children}</p>
}

export function InputErrorMessage({ id, children }: { id: string; children: ReactNode }) {
  return <p className="input-error" id={id}>{children}</p>
}

/**
 * Resolve aria-describedby + the help/error element ids consistently across variants.
 * Per the CSS rules: when both help and error are present, error wins for aria-describedby
 * and help is suppressed visually in the v1 design.
 */
export function useInputAria(id: string, helpText: string | undefined, error: string | undefined) {
  const helpId = helpText && !error ? `${id}-help` : undefined
  const errorId = error ? `${id}-error` : undefined
  const ariaDescribedBy = errorId ?? helpId
  return { helpId, errorId, ariaDescribedBy }
}
