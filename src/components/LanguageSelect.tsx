import { useCallback, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SUPPORTED_LANGUAGES } from '../../shared/evaluation.ts'
import { useDismiss } from '../hooks/useDismiss'

export function LanguageSelect({ value, onChange, label = true }: { value: string; onChange: (value: string) => void; label?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)

  return (
    <div className="language-select" ref={ref}>
      <button
        type="button"
        className="language-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Seleccionar lenguaje"
        onClick={() => setOpen((current) => !current)}
      >
        {label && <span className="language-select-label">Lenguaje</span>}
        <span className="language-select-value">{value}</span>
        <ChevronDown size={14} className={`select-chevron${open ? ' open' : ''}`} />
      </button>
      {open && (
        <ul className="language-menu" role="listbox">
          {SUPPORTED_LANGUAGES.map((item) => (
            <li key={item} role="option" aria-selected={item === value}>
              <button
                type="button"
                className={`language-option${item === value ? ' selected' : ''}`}
                onClick={() => {
                  onChange(item)
                  setOpen(false)
                }}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
