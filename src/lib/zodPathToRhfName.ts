// Phase B helper for Drift A (Step 6 Phase A audit 2026-05-15).
// Zod issues come back with `path: (string | number)[]` describing the JSON
// location of a validation failure (e.g. ["marriages", 0, "partner"] for a
// nested field in an array). React-Hook-Form's setError() expects a dotted-
// string field name ("marriages.0.partner"). This helper bridges the two.
//
// Returns null when the path is empty — that case represents top-level
// unrecognized_keys errors (e.g. {decoy: "foo"} at the section root) where
// there is no specific form field to attach the error to. Callers should
// surface those via a form-level / status-banner channel.

export function zodPathToRhfName(path: ReadonlyArray<string | number>): string | null {
  if (!path || path.length === 0) return null
  return path.map((segment) => String(segment)).join('.')
}
