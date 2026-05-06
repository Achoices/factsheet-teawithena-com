// Lightweight locale lookup. Phase 1 stub — Phase 2 expands with welcome / expired /
// already-submitted / not-found / error copy.

export type Locale = 'de' | 'en'

export const copy = {
  de: {
    placeholder: {
      eyebrow: 'Tea with Ena',
      title: 'Faktenblatt',
      body: 'Das Formular wird vorbereitet.',
    },
  },
  en: {
    placeholder: {
      eyebrow: 'Tea with Ena',
      title: 'Fact sheet',
      body: 'The form is being prepared.',
    },
  },
} as const

export function defaultLocale(): Locale {
  return 'de'
}
