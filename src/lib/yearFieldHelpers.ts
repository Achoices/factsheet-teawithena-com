// Pure string ↔ canonical-type converters for YearField + YearRange.
// All functions are total: invalid input returns the empty canonical shape
// rather than throwing. Validation is upstream (Zod regex on the schema);
// these helpers only convert shapes, so they must be tolerant of whatever
// form state happens to be.
//
// parseYearRange ALWAYS returns a YearRange object (never null) when given
// an empty input — matches operator-platform Step 4's explicit-empty emit
// per drift #3 resolution.

import {
  type YearField,
  type YearRange,
  EMPTY_YEAR_FIELD,
  EMPTY_YEAR_RANGE,
} from './factSheetTypes'

export function parseYearField(input: string | null | undefined): YearField {
  if (input === null || input === undefined) return { ...EMPTY_YEAR_FIELD }
  const trimmed = String(input).trim()
  if (!trimmed) return { ...EMPTY_YEAR_FIELD }
  const approximate = trimmed.startsWith('~')
  const stripped = approximate ? trimmed.slice(1).trim() : trimmed
  const match = stripped.match(/^(\d{4})$/)
  return {
    value: match ? parseInt(match[1], 10) : null,
    approximate,
  }
}

export function formatYearField(yf: YearField): string {
  if (yf.value === null || yf.value === undefined) return ''
  return (yf.approximate ? '~' : '') + String(yf.value)
}

export function parseYearRange(input: string | null | undefined): YearRange {
  if (input === null || input === undefined) return { start: { ...EMPTY_YEAR_FIELD }, end: null }
  const trimmed = String(input).trim()
  if (!trimmed) return { start: { ...EMPTY_YEAR_FIELD }, end: null }
  const parts = trimmed.split('-').map((p) => p.trim())
  const start = parseYearField(parts[0])
  const end = parts.length > 1 ? parseYearField(parts[1]) : null
  return { start, end }
}

export function formatYearRange(yr: YearRange | null | undefined): string {
  if (!yr) return ''
  const startStr = formatYearField(yr.start)
  if (!yr.end) return startStr
  const endStr = formatYearField(yr.end)
  if (!startStr && !endStr) return ''
  return startStr + '-' + endStr
}

// Re-export the empty constants so call sites can grab everything from one module.
export { EMPTY_YEAR_FIELD, EMPTY_YEAR_RANGE }
