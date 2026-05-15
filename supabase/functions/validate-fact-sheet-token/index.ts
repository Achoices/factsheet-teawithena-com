// validate-fact-sheet-token
//
// Called by the React app on page load with `{ token }`. Validates the magic-link
// token, returns the interview's display data + locale on success, or a specific
// failure reason. Has the side-effect of promoting `pending` → `in_progress` (and
// touching `fact_sheet_last_activity_at` for any non-terminal load), so the operator
// sees activity in Operator Platform without needing to refresh manually.
//
// Schema dependency: Document Definitions v1.3.0 (interviews.fact_sheet_*).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Testing-phase CORS whitelist. Lock down to just the custom domain when real
// interviewers start using the form (drop localhost + .netlify.app entries).
const ALLOWED_ORIGINS = new Set([
  'https://factsheet.teawithena.com',
  'http://localhost:5173',
  'https://factsheet-teawithena-com.netlify.app',
])

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin)
    ? origin
    : 'https://factsheet.teawithena.com'
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  const origin = req.headers.get('origin')

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return json({ valid: false, reason: 'malformed_token' }, 405, origin)
  }

  let token: unknown
  try {
    const body = await req.json()
    token = body?.token
  } catch (_) {
    return json({ valid: false, reason: 'malformed_token' }, 200, origin)
  }

  // Token format: 44-char URL-safe base64. Allow 20–100 to tolerate minor format drift
  // without rejecting legitimate tokens; the actual lookup will fail closed for any
  // string that doesn't exist in the table.
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) {
    return json({ valid: false, reason: 'malformed_token' }, 200, origin)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: interview, error } = await supabase
    .from('interviews')
    .select(
      'interview_code, interviewee_names, original_language, ' +
      'fact_sheet_status, fact_sheet_token_expires_at, fact_sheet_submitted_at, ' +
      'biographical_facts',
    )
    .eq('fact_sheet_token', token)
    .maybeSingle()

  if (error) {
    console.error('Supabase query error:', error)
    return json({ valid: false, reason: 'server_error' }, 500, origin)
  }

  if (!interview) {
    return json({ valid: false, reason: 'token_not_found' }, 200, origin)
  }

  if (new Date(interview.fact_sheet_token_expires_at) < new Date()) {
    return json({ valid: false, reason: 'expired' }, 200, origin)
  }

  if (interview.fact_sheet_status === 'submitted') {
    return json(
      {
        valid: false,
        reason: 'already_submitted',
        submitted_at: interview.fact_sheet_submitted_at,
      },
      200,
      origin,
    )
  }

  // Side-effect: promote pending → in_progress; either way, refresh last-activity.
  // Failure here doesn't fail the validation — operator timestamp accuracy is nice
  // but not load-bearing for the interviewer's experience.
  const updates: Record<string, string> = {
    fact_sheet_last_activity_at: new Date().toISOString(),
  }
  if (interview.fact_sheet_status === 'pending') {
    updates.fact_sheet_status = 'in_progress'
  }
  const { error: updateError } = await supabase
    .from('interviews')
    .update(updates)
    .eq('fact_sheet_token', token)
  if (updateError) {
    console.error('Supabase activity-update error (non-fatal):', updateError)
  }

  // Display name + locale for the welcome page. interviewee_names is an array
  // of full names ("Anna Berger"); we use the first word of the first entry.
  const firstName =
    (interview.interviewee_names?.[0] ?? '').split(' ').filter(Boolean)[0] ?? ''
  const language: 'de' | 'en' =
    interview.original_language === 'en' ? 'en' : 'de'

  return json(
    {
      valid: true,
      interview: {
        interview_code: interview.interview_code,
        interviewee_first_name: firstName,
        language,
        // Load-path fix (Step 6 follow-up 2026-05-15): the React form
        // mounts with biographical_facts as initial state. Returning it
        // here keeps the load on the same round-trip as token validation.
        // Per-section denormalizers (denormalizeSection.ts) convert
        // canonical YearField/YearRange/etc. back to form-state strings.
        biographical_facts: interview.biographical_facts ?? null,
      },
    },
    200,
    origin,
  )
})
