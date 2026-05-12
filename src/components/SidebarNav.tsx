import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SECTION_IDS, type SectionId } from '../lib/sections'
import { copy, type Locale } from '../lib/i18n'

interface SidebarNavProps {
  locale: Locale
  currentSectionId: SectionId
  token: string
}

export function SidebarNav({ locale, currentSectionId, token }: SidebarNavProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const t = copy[locale]

  const go = (id: SectionId) => {
    setOpen(false)
    navigate(`/form/${id}?token=${encodeURIComponent(token)}`)
  }

  return (
    <>
      {/* Mobile: hamburger trigger row (visible md:hidden) */}
      <div className="md:hidden flex items-center justify-between px-6 pt-6 pb-2 border-b border-rule">
        <p className="eyebrow">{t.eyebrow}</p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={t.form.nav.menu}
          aria-expanded={open}
          className="p-2 -mr-2 text-ink-soft hover:text-ink"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer (open) / Desktop fixed rail */}
      <aside
        className={[
          // mobile drawer
          open ? 'block' : 'hidden',
          'md:block',
          'bg-bg-sunken md:bg-transparent',
          'border-b border-rule md:border-b-0 md:border-r',
          'md:w-64 md:flex-shrink-0',
          'md:min-h-screen',
          'px-6 py-6 md:px-8 md:py-14',
        ].join(' ')}
        aria-label={t.form.nav.menu}
      >
        <p className="eyebrow mb-6 hidden md:block">{t.eyebrow}</p>
        <ol className="space-y-1">
          {SECTION_IDS.map((id, i) => {
            const isCurrent = id === currentSectionId
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => go(id)}
                  className={[
                    'group w-full text-left py-2 pl-2 pr-3 -ml-2 rounded',
                    'font-body text-[14px] leading-snug',
                    'flex items-baseline gap-3',
                    isCurrent
                      ? 'text-accent-deep font-medium bg-bg-sunken md:bg-bg-accent'
                      : 'text-ink-soft hover:text-ink',
                  ].join(' ')}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  <span className={['font-mono text-[11px] tracking-wide', isCurrent ? 'text-accent-deep' : 'text-muted-soft'].join(' ')}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{t.sections[id].title}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </aside>
    </>
  )
}
