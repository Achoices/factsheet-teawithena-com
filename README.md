# factsheet.teawithena.com

Customer-facing fact-sheet form for Tea with Ena. Interviewers (typically adult children) land here from a magic-link email and fill in 12 short biographical sections about their parent or grandparent.

## What this is

- **Magic-link authenticated** — `/?token=<44-char-token>` is the only entry point. Tokens are minted by the n8n workflow `wf-send-fact-sheet-email` (workflow ID `4AemTXif0CXO6yu4`) when an operator clicks "Send fact-sheet" inside Operator Platform.
- **Single-page form** — 12 collapsible sections, mobile-first, autosaves as you type. (Phase 3 work; Phase 1+2 ship the foundation + landing pages only.)
- **Customer-facing surface** — uses the Tea with Ena Design System (cream surface, Spectral display + Manrope body, wide-tracked uppercase eyebrow, clay-terracotta accent). NOT a SaaS-default look; see `docs/VISUAL.md` of the design system for rules.

## Stack

- **React 19** + **TypeScript 6** + **Vite 8** (default Rolldown bundler)
- **Tailwind CSS 3.4** (pinned — see Design System sync below)
- **@tanstack/react-query 5** for the token-validation call
- **@supabase/supabase-js 2** for the Supabase client
- No router (single route; UI branches on token-validation result)
- No build chain beyond Vite — `npm run build` produces a static `dist/` for Netlify

## Local dev

```bash
cp .env.example .env.local
# then edit .env.local with the real VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Deploy

- **Hosted by**: Netlify (team: Biography Agent), site `factsheet-teawithena-com`
- **Custom domain**: `factsheet.teawithena.com` via Cloudflare DNS (CNAME)
- **Auto-deploy**: every push to `main`
- **Env vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` set via Netlify dashboard. Don't commit them.

## Design system sync

This repo **vendors** files from the Tea with Ena Design System rather than depending on it as a package. Source of truth: `operator-platform/design-system/` at commit `1e676a3`.

| Vendored here | Source path | Modifications |
|---|---|---|
| `src/styles/colors_and_type.css` | `colors_and_type.css` (root) | 16 `@font-face url('fonts/X.ttf')` rewritten to `url('/fonts/X.ttf')` so they resolve via Vite's `public/` → `/fonts/` mapping. Provenance comment at top of file. |
| `tailwind.config.ts` | `tailwind-config-extension.js` (root) | CommonJS → ESM port (`module.exports = {...}` → `import type { Config }; const config: Config = {...}; export default config`). `content: [...]` field added (the source is a snippet meant for merging; this wraps it as a standalone Tailwind v3 config). `theme.extend` and `plugins` blocks copied verbatim. Provenance comment at top of file. |
| `public/fonts/*.ttf` | `fonts/*.ttf` (15 files) | Byte-identical copy. |

To re-sync after a design system update: re-vendor from the new commit, re-apply the same modifications, bump the provenance comments. (A sync script may be added later — see Future Backlog.)

### Why Tailwind v3.4 specifically

Per Decision Log entry **2026-05-06 — "Tailwind v3.4 pin for factsheet repo"**: the design system at commit `1e676a3` is authored in Tailwind v3 idiom (`module.exports = { theme: { extend: {...} } }`). Tailwind v4 uses a CSS-first `@theme { ... }` paradigm that would force re-authoring of the canonical token file. Until BACKLOG-DESIGN-SYSTEM-002 (v4 migration project) lands, this repo stays on v3.4.

## Phase status

| Phase | Status | Scope |
|---|---|---|
| **Phase 1** — Foundation | landing today (this commit) | Repo scaffold, Vite + React + TS, design tokens vendored, blank styled page deploys |
| **Phase 2** — Auth + routing | landing today (next commit) | Edge Function `validate-fact-sheet-token`, locale-aware Welcome / Expired / AlreadySubmitted / NotFound / Error pages |
| **Phase 3** — Form sections | future session | 12 collapsible sections, autosave, react-hook-form + zod + @radix-ui |
| **Phase 4** — Submit flow | future session | `submit-fact-sheet` Edge Function, terminal `submitted` status |

## Out of scope

- Email open/click tracking. (Probably never — invasive.)
- Server-side rendering. (Vite SPA is fine; no SEO surface area on a token-gated page.)
- Sentry / external error monitoring. (Rely on Supabase function logs + Netlify deploy logs.)

## Future Backlog

- **BACKLOG-DESIGN-SYSTEM-002** — Tailwind v4 migration project (re-author design system + all consumers in lockstep)
- **BACKLOG-DESIGN-SYSTEM-003** — fix `theme('fontFamily.body').join(', ')` in source `tailwind-config-extension.js` (line ~268). Tailwind 3.4+ resolves the value as string, not array; `.join()` throws at build time. Worked around in this repo's vendored copy with `as string` cast and `.join` removed.
- **Sync script** — `scripts/sync-design-system.sh` that diff-checks against `operator-platform/design-system/<commit>/` and reports drift
- **Phase 3 Input component** — design system has no Input yet (only Button is locked); needs Track B authoring before Phase 3 can ship the form
