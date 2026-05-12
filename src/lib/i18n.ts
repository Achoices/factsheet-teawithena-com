// Locale lookup for the factsheet app. Tone reference: design-system/docs/CONTENT.md
// — warm not cute, intimate not informal, unhurried not lazy. No exclamation marks.
// Sentence case everywhere except the eyebrow.

export type Locale = 'de' | 'en'

const CONTACT_EMAIL = 'arnim@teawithena.com'

export const copy = {
  de: {
    eyebrow: 'Tea with Ena',
    loading: 'Einen Moment',
    placeholder: {
      title: 'Faktenblatt',
      body: 'Das Formular wird vorbereitet.',
    },
    welcome: {
      eyebrow: 'Faktenblatt',
      heading: (firstName: string) =>
        firstName ? `Hier ist ${firstName}.` : 'Hier ist das Faktenblatt.',
      body: 'Auf den nächsten Seiten findest du zwölf kurze Abschnitte. Namen, Daten, Orte, kleine Geschichten. Alles wird automatisch gespeichert. Lass dir Zeit.',
      cta: 'Beginnen',
      ctaNote: 'Das Formular folgt in Kürze.',
    },
    expired: {
      eyebrow: 'Faktenblatt',
      heading: 'Der Link ist abgelaufen.',
      body: 'Magic-Links sind 90 Tage gültig. Schreib uns kurz, und wir schicken dir einen neuen.',
      contact: CONTACT_EMAIL,
    },
    alreadySubmitted: {
      eyebrow: 'Faktenblatt',
      heading: 'Vielen Dank.',
      body: 'Du hast das Faktenblatt bereits abgeschickt. Wir nehmen es von hier.',
      bodyWithDate: (when: string) =>
        `Du hast das Faktenblatt am ${when} abgeschickt. Wir nehmen es von hier.`,
    },
    notFound: {
      eyebrow: 'Faktenblatt',
      heading: 'Wir können diesen Link nicht finden.',
      body: 'Bitte prüfe die E-Mail mit dem Link, oder schreib uns kurz, falls etwas nicht stimmt.',
      contact: CONTACT_EMAIL,
    },
    error: {
      eyebrow: 'Faktenblatt',
      heading: 'Etwas ist schiefgelaufen.',
      body: 'Bitte versuche es in einem Moment erneut. Wenn es bestehen bleibt, schreib uns kurz.',
      retry: 'Erneut versuchen',
      contact: CONTACT_EMAIL,
    },
    form: {
      eyebrow: 'Faktenblatt',
      progress: (current: number, total: number) => `Abschnitt ${current} von ${total}`,
      placeholderBody: 'Hier werden in Kürze die Felder dieses Abschnitts erscheinen.',
      nav: {
        menu: 'Abschnitte',
        prev: 'Zurück',
        next: 'Speichern und weiter',
        submit: 'Abschicken',
        submitNote: 'wird in Kürze verfügbar',
      },
    },
    sections: {
      subject: { title: 'Die Person' },
      father: { title: 'Vater' },
      mother: { title: 'Mutter' },
      grandparents: { title: 'Großeltern' },
      siblings: { title: 'Geschwister' },
      education: { title: 'Schule und Ausbildung' },
      military: { title: 'Wehrdienst' },
      career: { title: 'Beruf' },
      relationships: { title: 'Ehe, Familie, Kinder' },
      residences: { title: 'Wohnorte' },
      anchors: { title: 'Erinnerungsanker' },
      health: { title: 'Gesundheit' },
    },
  },
  en: {
    eyebrow: 'Tea with Ena',
    loading: 'Just a moment',
    placeholder: {
      title: 'Fact sheet',
      body: 'The form is being prepared.',
    },
    welcome: {
      eyebrow: 'Fact sheet',
      heading: (firstName: string) =>
        firstName ? `Here's ${firstName}.` : "Here's the fact sheet.",
      body: 'Twelve short sections, on the next pages. Names, dates, places, small stories. Everything saves as you go. Take your time.',
      cta: 'Begin',
      ctaNote: 'The form will be ready shortly.',
    },
    expired: {
      eyebrow: 'Fact sheet',
      heading: 'The link has expired.',
      body: 'Magic links are valid for 90 days. Write to us and we will send a new one.',
      contact: CONTACT_EMAIL,
    },
    alreadySubmitted: {
      eyebrow: 'Fact sheet',
      heading: 'Thank you.',
      body: "You've already submitted the fact sheet. We'll take it from here.",
      bodyWithDate: (when: string) =>
        `You submitted the fact sheet on ${when}. We'll take it from here.`,
    },
    notFound: {
      eyebrow: 'Fact sheet',
      heading: "We can't find that link.",
      body: "Please check the email with the link, or write to us if something doesn't look right.",
      contact: CONTACT_EMAIL,
    },
    error: {
      eyebrow: 'Fact sheet',
      heading: 'Something went wrong.',
      body: 'Please try again in a moment. If it persists, write to us.',
      retry: 'Try again',
      contact: CONTACT_EMAIL,
    },
    form: {
      eyebrow: 'Fact sheet',
      progress: (current: number, total: number) => `Section ${current} of ${total}`,
      placeholderBody: 'The fields for this section will appear here shortly.',
      nav: {
        menu: 'Sections',
        prev: 'Back',
        next: 'Save and continue',
        submit: 'Submit',
        submitNote: 'coming soon',
      },
    },
    sections: {
      subject: { title: 'The subject' },
      father: { title: 'Father' },
      mother: { title: 'Mother' },
      grandparents: { title: 'Grandparents' },
      siblings: { title: 'Siblings' },
      education: { title: 'Education' },
      military: { title: 'Military service' },
      career: { title: 'Career' },
      relationships: { title: 'Family' },
      residences: { title: 'Places lived' },
      anchors: { title: 'Memory anchors' },
      health: { title: 'Health' },
    },
  },
} as const

export function defaultLocale(): Locale {
  return 'de'
}

export function formatDate(iso: string, locale: Locale): string {
  try {
    return new Date(iso).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch (_) {
    return iso
  }
}
