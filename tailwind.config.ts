// vendored from operator-platform/design-system/tailwind-config-extension.js at commit 1e676a3
// ported CommonJS → ESM, content field added; theme.extend + plugins copied verbatim
// Original was a snippet meant to be merged into a consumer's config; this wraps it as a
// standalone Tailwind v3 config for the factsheet-teawithena-com repo.
// Deviation #1: CommonJS → ESM (module.exports → const + export default)
// Deviation #2: added content: [...] field (source is a snippet; standalone config needs it)
// Deviation #3: removed `.join(', ')` from `.eyebrow` plugin's fontFamily (line ~258).
//   Source bug: Tailwind 3.4+ resolves theme('fontFamily.body') as string, not array.
//   Flagged as BACKLOG-DESIGN-SYSTEM-003 in repo README — fix needed in source design system.
// See README 'Design system sync' for re-vendor procedure.

import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx,html}'],
  theme: {
    // --- Breakpoints (mobile-first; matches brief) ---
    screens: {
      sm: '640px',   // tablet min
      md: '768px',
      lg: '1024px',  // desktop min
      xl: '1280px',
      '2xl': '1536px',
    },

    extend: {
      // ---------------- Colors (Atelier palette) ----------------
      colors: {
        // Raw palette — locked
        surface:        '#FBF8F1',
        ink:            '#1C1C1A',
        'ink-soft':     '#3A3A36',
        muted:          '#6B6A64',
        'muted-soft':   '#A39D8D',
        accent:         '#A86E52',
        'accent-deep':  '#7E4E37',
        border:         '#E6E1D3',
        'border-strong':'#CDC6B2',

        // Semantic surfaces
        bg: {
          DEFAULT: '#FBF8F1',
          raised:  '#FFFFFF',
          sunken:  '#F4EFE3',
          accent:  '#F2E6DD',
        },

        // Semantic text
        fg: {
          DEFAULT:     '#1C1C1A',
          soft:        '#3A3A36',
          muted:       '#6B6A64',
          placeholder: '#A39D8D',
          accent:      '#7E4E37',
          'on-accent': '#FBF8F1',
        },

        // States — earth-toned, never signal-colored
        success: { DEFAULT: '#5C7A4F', bg: '#EAEFE3' },
        warning: { DEFAULT: '#B07C2E', bg: '#F4EAD3' },
        danger:  { DEFAULT: '#8A3B2C', bg: '#F1DDD7' },
        info:    { DEFAULT: '#4F6A7A', bg: '#E1E8EE' },

        // ---- v1.1 Semantic layer (preferred role names) ----
        // Production code should reference these, not the raw palette.
        text: {
          primary:   '#1C1C1A', // ink
          secondary: '#3A3A36', // ink-soft
          muted:     '#6B6A64', // muted
          inverse:   '#FBF8F1', // surface
        },
        // `bg-elevated` is white over cream so cards lift without coldness;
        // `bg-sunken` is a deeper tint of surface for wells.
        // (existing `bg.raised`/`bg.sunken` aliases above still resolve.)
        // Border roles
        // (use `border-DEFAULT`, `border-strong`, `border-subtle`)
        // Defined alongside `borderColor` extension below.

        // Accent role
        // accent.DEFAULT/.hover/.active — overrides the flat `accent` token above.
        // We keep the flat `accent` for backward compat by leaving it as `#A86E52`
        // and add a nested object under a different key.
        accentRole: {
          DEFAULT: '#A86E52', // accent
          hover:   '#7E4E37', // accent-deep
          active:  '#6A412E', // accent-deep -6%
        },

        // State — palette-adjacent, never signal-bright
        state: {
          error:   { DEFAULT: '#8A3B2C', bg: '#F1DDD7' }, // iron oxide
          success: { DEFAULT: '#5C7A4F', bg: '#EAEFE3' }, // bottle green
          info:    { DEFAULT: '#4F6A7A', bg: '#E1E8EE' }, // slate
          warning: { DEFAULT: '#B07C2E', bg: '#F4EAD3' }, // copper
        },
      },

      // ---------------- Typography ----------------
      fontFamily: {
        display: ['Spectral', 'Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
        body:    ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],

        // Aliases — semantic
        sans:    ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif:   ['Spectral', 'Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
      },

      fontSize: {
        // [size, { lineHeight, letterSpacing, fontWeight }]
        // Mobile is the source of truth. `*-lg` variants nudge up at lg: breakpoint.
        eyebrow:    ['0.75rem',   { lineHeight: '1.4',  letterSpacing: '0.4em',   fontWeight: '500' }],
        meta:       ['0.8125rem', { lineHeight: '1.5',  letterSpacing: '0.04em',  fontWeight: '400' }],
        body:       ['1rem',      { lineHeight: '1.55', fontWeight: '400' }],

        // Mobile defaults
        lead:       ['1.0625rem', { lineHeight: '1.7',  fontWeight: '300' }],
        h3:         ['1.25rem',   { lineHeight: '1.3',  fontWeight: '500' }],
        h2:         ['1.75rem',   { lineHeight: '1.2',  letterSpacing: '-0.01em', fontWeight: '400' }],
        h1:         ['2.25rem',   { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '400' }],
        display:    ['3rem',      { lineHeight: '1.1',  letterSpacing: '-0.02em', fontWeight: '300' }],

        // Desktop overrides — use as `lg:text-h1-lg`, `lg:text-display-lg` etc.
        'lead-lg':    ['1.125rem',  { lineHeight: '1.7',  fontWeight: '300' }],
        'h3-lg':      ['1.375rem',  { lineHeight: '1.3',  fontWeight: '500' }],
        'h2-lg':      ['2.25rem',   { lineHeight: '1.2',  letterSpacing: '-0.01em', fontWeight: '400' }],
        'h1-lg':      ['3rem',      { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '400' }],
        'display-lg': ['4rem',      { lineHeight: '1.1',  letterSpacing: '-0.02em', fontWeight: '300' }],
      },

      letterSpacing: {
        tightest: '-0.02em',
        tight:    '-0.01em',
        normal:   '0',
        wide:     '0.04em',
        eyebrow:  '0.4em',  // SIGNATURE
      },

      lineHeight: {
        tight:   '1.15',
        snug:    '1.3',
        normal:  '1.55',
        relaxed: '1.7',
      },

      fontWeight: {
        light:    '300',
        normal:   '400',
        medium:   '500',
        semibold: '600',
      },

      // ---------------- Spacing (4px base; extends defaults) ----------------
      spacing: {
        'gutter':    '1.5rem',  // 24
        'section':   '3rem',    // 48
        'major':     '6rem',    // 96
        'page':      '8rem',    // 128
      },

      // ---------------- Layout measures ----------------
      maxWidth: {
        prose: '62ch',
        form:  '40rem',
        email: '600px',
      },

      // ---------------- Radii ----------------
      borderRadius: {
        none: '0',
        sm:   '2px',
        DEFAULT: '4px',
        md:   '4px',
        lg:   '6px',
        full: '9999px',
      },

      // ---------------- Borders ----------------
      borderColor: {
        DEFAULT: '#E6E1D3',
        strong:  '#CDC6B2',
        subtle:  'rgba(163,157,141,0.24)',
      },
      borderWidth: {
        DEFAULT: '1px',
        hairline: '1px',
      },

      // ---------------- Interaction ----------------
      // Hover/active overlays compose with any underlying fill.
      opacity: {
        hover:  '0.06',
        active: '0.12',
      },
      ringColor: {
        focus: '#A86E52',
      },
      ringOffsetColor: {
        focus: '#FBF8F1',
      },
      ringWidth: {
        focus: '2px',
      },
      ringOffsetWidth: {
        focus: '2px',
      },

      // ---------------- Shadows (3 elevations, warm/soft) ----------------
      boxShadow: {
        1: '0 1px 2px rgba(28,28,26,0.04), 0 1px 1px rgba(28,28,26,0.03)',
        2: '0 2px 6px rgba(28,28,26,0.05), 0 4px 12px rgba(28,28,26,0.04)',
        3: '0 8px 24px rgba(28,28,26,0.07), 0 16px 48px rgba(28,28,26,0.06)',
        // Aliases for semantic use
        card:   '0 1px 2px rgba(28,28,26,0.04), 0 1px 1px rgba(28,28,26,0.03)',
        sticky: '0 2px 6px rgba(28,28,26,0.05), 0 4px 12px rgba(28,28,26,0.04)',
        modal:  '0 8px 24px rgba(28,28,26,0.07), 0 16px 48px rgba(28,28,26,0.06)',
        focus:  '0 0 0 2px #FBF8F1, 0 0 0 4px #A86E52',
        none:   'none',
      },

      // ---------------- Motion ----------------
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0.0, 0.0, 1.0)',
        emphasis: 'cubic-bezier(0.4, 0.0, 0.2, 1.0)',
        exit:     'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
      },
      transitionDuration: {
        fast: '120ms',
        DEFAULT: '200ms',
        base: '200ms',
        slow: '360ms',
        page: '600ms',
      },

      // ---------------- Animations ----------------
      keyframes: {
        'fade-in':    { from: { opacity: 0 }, to: { opacity: 1 } },
        'rise-in':    {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 0.4 },
          '50%':      { opacity: 1.0 },
        },
      },
      animation: {
        'fade-in':    'fade-in 600ms cubic-bezier(0.2,0,0,1) both',
        'rise-in':    'rise-in 360ms cubic-bezier(0.2,0,0,1) both',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
      },
    },
  },

  plugins: [
    /**
     * Adds the .eyebrow utility — the system's signature.
     * Use as: <p class="eyebrow">Chapter one</p>
     */
    function ({ addComponents, theme }) {
      addComponents({
        '.eyebrow': {
          // deviation from source: removed `.join(', ')` — Tailwind 3.4 resolves
          // theme('fontFamily.body') to a string, not an array. Bucket B finding
          // (BACKLOG-DESIGN-SYSTEM-003): source design-system tailwind-config-extension.js
          // line 268 has the same `.join` and would fail any Tailwind 3.4+ build.
          fontFamily: theme('fontFamily.body') as string,
          fontWeight: '500',
          fontSize: theme('fontSize.eyebrow[0]'),
          lineHeight: '1.4',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color: theme('colors.muted'),
        },
        '.eyebrow-ink': {
          color: theme('colors.ink'),
        },
        '.eyebrow-accent': {
          color: theme('colors.accent-deep'),
        },
        '.rule': {
          borderTop: '1px solid ' + theme('colors.border'),
        },
        '.rule-strong': {
          borderTop: '1px solid ' + theme('colors.border-strong'),
        },
        '.rule-ink': {
          borderTop: '1px solid ' + theme('colors.ink'),
        },
        '.measure-prose': { maxWidth: '62ch' },
        '.measure-form':  { maxWidth: '40rem' },
        '.measure-email': { maxWidth: '600px' },

        // ---- v1.1 Focus + interaction utilities ----
        '.focus-ring': {
          outline: 'none',
          '&:focus-visible': {
            boxShadow: '0 0 0 2px #FBF8F1, 0 0 0 4px #A86E52',
          },
        },
        // `.hover-overlay` darkens any element on hover/active without
        // changing its base color — composes cleanly with accent fills.
        '.hover-overlay': {
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: '0',
            background: 'currentColor',
            opacity: '0',
            transition: 'opacity 200ms cubic-bezier(.4,0,.2,1)',
            pointerEvents: 'none',
            borderRadius: 'inherit',
          },
          '&:hover::after':  { opacity: '0.06' },
          '&:active::after': { opacity: '0.12' },
        },
      });
    },
  ],
};

export default config
