import { copy, defaultLocale } from './lib/i18n'

function App() {
  const locale = defaultLocale()
  const t = copy[locale].placeholder

  return (
    <main className="min-h-screen bg-surface text-ink flex items-center justify-center px-6">
      <div className="text-center max-w-prose">
        <p className="eyebrow mb-6">{t.eyebrow}</p>
        <h1 className="font-display font-light text-4xl text-ink mb-4 tracking-tight">{t.title}</h1>
        <p className="font-body text-base text-ink-soft leading-relaxed">{t.body}</p>
      </div>
    </main>
  )
}

export default App
