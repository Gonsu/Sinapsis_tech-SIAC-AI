import { SUPPORTED_LANGUAGES, type EvaluationResultData } from '../../shared/evaluation.ts'

// Datos que se guardan solo en este navegador (localStorage).
// Todas las lecturas y escrituras toleran que localStorage no esté disponible (modo privado, bloqueado, etc.).

const KEYS = {
  draft: 'siac-ai-statement-draft',
  history: 'siac-ai-history',
  settings: 'siac-ai-settings',
} as const

export const MAX_HISTORY_ENTRIES = 20

export interface HistoryEntry {
  id: string
  date: string
  statement: string
  code: string
  language: string
  fileName: string | null
  result: EvaluationResultData
}

export interface Settings {
  displayName: string
  defaultLanguage: string
  saveHistory: boolean
  saveDraft: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  displayName: 'Estudiante',
  defaultLanguage: 'Python',
  saveHistory: true,
  saveDraft: true,
}

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Sin almacenamiento disponible: la app sigue funcionando sin persistir.
  }
}

const remove = (key: string) => {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignorado por la misma razón que en write().
  }
}

// --- Borrador del enunciado (RF-1) ---
// Se guarda como texto plano para seguir leyendo los borradores creados antes de este módulo.

export const loadDraft = (): string => {
  try {
    return localStorage.getItem(KEYS.draft) ?? ''
  } catch {
    return ''
  }
}

export const saveDraft = (statement: string): void => {
  try {
    localStorage.setItem(KEYS.draft, statement)
  } catch {
    // Ignorado: no se pudo persistir el borrador
  }
}

export const clearDraft = () => remove(KEYS.draft)

// --- Configuración ---

export const loadSettings = (): Settings => {
  const stored = read<Partial<Settings>>(KEYS.settings, {})
  const settings = { ...DEFAULT_SETTINGS, ...stored }
  if (!SUPPORTED_LANGUAGES.includes(settings.defaultLanguage as (typeof SUPPORTED_LANGUAGES)[number])) {
    settings.defaultLanguage = DEFAULT_SETTINGS.defaultLanguage
  }
  return settings
}

export const saveSettings = (settings: Settings) => write(KEYS.settings, settings)

// --- Historial ---

export const loadHistory = () => {
  const entries = read<HistoryEntry[]>(KEYS.history, [])
  return Array.isArray(entries) ? entries : []
}

export const saveHistory = (entries: HistoryEntry[]) => write(KEYS.history, entries.slice(0, MAX_HISTORY_ENTRIES))

export const createHistoryEntry = (data: Omit<HistoryEntry, 'id' | 'date'>): HistoryEntry => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString(),
  ...data,
})

export const clearAllLocalData = () => Object.values(KEYS).forEach(remove)
