import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  AlertCircle,
  Bell,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Copy,
  FileText,
  History,
  LayoutDashboard,
  Lightbulb,
  LoaderCircle,
  Menu,
  MessageCircle,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
import {
  MIN_STATEMENT_LENGTH,
  SUPPORTED_LANGUAGES,
  validateEvaluationInput,
  type EvaluationResultData,
  type ValidationErrors,
} from '../shared/evaluation.ts'
import { useDismiss } from './hooks/useDismiss'
import { analyzeCodeCompliance } from './services/evaluationService'
import {
  clearAllLocalData,
  clearDraft,
  createHistoryEntry,
  DEFAULT_SETTINGS,
  loadDraft,
  loadHistory,
  loadSettings,
  MAX_HISTORY_ENTRIES,
  saveDraft,
  saveHistory,
  saveSettings,
  type HistoryEntry,
  type Settings as UserSettings,
} from './services/localData'
import { HistoryView } from './views/HistoryView'
import { ResourcesView } from './views/ResourcesView'
import { SettingsView } from './views/SettingsView'
import './App.css'

type EvaluationStatus = 'idle' | 'invalid' | 'error' | 'evaluated'
type NavId = 'inicio' | 'evaluar' | 'historial' | 'recursos' | 'configuracion'

type AppNotification = {
  id: string
  kind: 'success' | 'attention' | 'error'
  title: string
  text: string
  date: string
  read: boolean
}

const MAX_NOTIFICATIONS = 10

const navigation: { id: NavId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
  { id: 'evaluar', label: 'Evaluar código', icon: Code2 },
  { id: 'historial', label: 'Historial', icon: History },
  { id: 'recursos', label: 'Recursos', icon: BookOpen },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
]

const viewTitles: Record<'historial' | 'recursos' | 'configuracion', { title: string; text: string }> = {
  historial: { title: 'Historial', text: 'Consulta y vuelve a abrir tus evaluaciones anteriores.' },
  recursos: { title: 'Recursos', text: 'Guías para aprovechar mejor la evaluación de tu código.' },
  configuracion: { title: 'Configuración', text: 'Ajusta tus preferencias y revisa el estado del servicio.' },
}

const timeFormatter = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' })

function SiacMark({ light = false, className = '' }: { light?: boolean; className?: string }) {
  return (
    <div className={`siac-mark ${className} ${light ? 'siac-mark-light' : ''}`}>
      <BrainCircuit size={22} strokeWidth={1.8} />
    </div>
  )
}

function Sidebar({ open, onClose, activeNav, onNavigate, displayName }: { open: boolean; onClose: () => void; activeNav: NavId; onNavigate: (id: NavId) => void; displayName: string }) {
  return (
    <>
      {open && <button className="sidebar-backdrop lg:hidden" onClick={onClose} aria-label="Cerrar menú" />}
      <aside className={`sidebar ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="sidebar-brand">
          <div className="sidebar-branding">
            <SiacMark light className="siac-mark-sidebar" />
            <div className="sidebar-brand-copy">
              <p className="sidebar-brand-title">SIAC<span>-IA</span></p>
              <p className="sidebar-brand-subtitle">Aprendizaje inteligente</p>
            </div>
          </div>
          <button className="sidebar-close icon-button lg:hidden" onClick={onClose} aria-label="Cerrar menú">
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-label">Menú principal</div>

        <nav className="sidebar-nav">
          {navigation.map(({ id, label, icon: Icon }) => {
            const active = id === activeNav
            return (
              <button
                key={id}
                type="button"
                className={`nav-item ${active ? 'nav-item-active' : ''}`}
                onClick={() => onNavigate(id)}
                aria-current={active ? 'page' : undefined}
              >
                <span className="nav-item-icon"><Icon size={18} strokeWidth={active ? 2.2 : 1.8} /></span>
                <span>{label}</span>
                {active && <span className="nav-item-dot" />}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-card">
          <div className="sidebar-card-header">
            <ShieldCheck size={16} />
            <span>UFPS</span>
          </div>
          <div className="building-pattern" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="sidebar-card-title">Comprometidos<br />con la excelencia</p>
          <p className="sidebar-card-text">Formando profesionales para<br />transformar el futuro.</p>
        </div>

        <button type="button" className="sidebar-user" onClick={() => onNavigate('configuracion')} title="Ir a Configuración">
          <div className="avatar avatar-sidebar">
            <UserRound size={16} />
          </div>
          <div className="sidebar-user-copy">
            <p>{displayName}</p>
            <span>Estudiante</span>
          </div>
          <Settings size={15} className="sidebar-user-chevron" />
        </button>
      </aside>
    </>
  )
}

function NotificationsMenu({ notifications, onOpen, onClear }: { notifications: AppNotification[]; onOpen: () => void; onClear: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)

  const unread = notifications.some((notification) => !notification.read)

  return (
    <div className="dropdown-wrap" ref={ref}>
      <button
        type="button"
        className="notification-button"
        aria-label={unread ? 'Notificaciones (hay notificaciones sin leer)' : 'Notificaciones'}
        aria-expanded={open}
        onClick={() => {
          if (!open) onOpen()
          setOpen(!open)
        }}
      >
        <Bell size={19} />
        {unread && <span />}
      </button>

      {open && (
        <div className="dropdown-panel notifications-panel" role="dialog" aria-label="Notificaciones">
          <div className="dropdown-header">
            <p>Notificaciones</p>
            {notifications.length > 0 && (
              <button type="button" className="link-button" onClick={onClear}>Limpiar</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="dropdown-empty">No tienes notificaciones. Aquí verás el resultado de tus evaluaciones.</p>
          ) : (
            <ul className="notification-list">
              {notifications.map((notification) => (
                <li key={notification.id} className={`notification-item notification-${notification.kind}`}>
                  {notification.kind === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <div>
                    <p className="notification-title">{notification.title}</p>
                    <p className="notification-text">{notification.text}</p>
                    <p className="notification-time">{timeFormatter.format(new Date(notification.date))}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function UserMenu({ displayName, onNavigate }: { displayName: string; onNavigate: (id: NavId) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)

  const go = (id: NavId) => {
    setOpen(false)
    onNavigate(id)
  }

  return (
    <div className="dropdown-wrap" ref={ref}>
      <button type="button" className="user-menu-button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>
        <div className="avatar avatar-header">
          <UserRound size={16} />
        </div>
        <span className="user-name">{displayName}</span>
        <ChevronDown size={15} className={`user-chevron ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="dropdown-panel user-panel" role="menu">
          <div className="dropdown-header">
            <p>{displayName}</p>
          </div>
          <button type="button" role="menuitem" className="dropdown-item" onClick={() => go('historial')}>
            <History size={15} />Mi historial
          </button>
          <button type="button" role="menuitem" className="dropdown-item" onClick={() => go('configuracion')}>
            <Settings size={15} />Configuración
          </button>
        </div>
      )}
    </div>
  )
}

function Header({
  onMenu,
  displayName,
  notifications,
  onOpenNotifications,
  onClearNotifications,
  onNavigate,
}: {
  onMenu: () => void
  displayName: string
  notifications: AppNotification[]
  onOpenNotifications: () => void
  onClearNotifications: () => void
  onNavigate: (id: NavId) => void
}) {
  return (
    <header className="topbar">
      <div className="header-branding">
        <button className="icon-button menu-button lg:hidden" onClick={onMenu} aria-label="Abrir menú">
          <Menu size={21} />
        </button>

        <div className="ufps-brand">
          <img src="/ufps-logo.png" alt="Universidad Francisco de Paula Santander" className="ufps-logo" />
          <p className="ufps-brand-copy">
            <span>Universidad Francisco</span>
            <span>de Paula Santander</span>
          </p>
        </div>

        <div className="header-divider" />

        <div className="siac-brand">
          <SiacMark className="siac-mark-header" />
          <div className="siac-brand-copy">
            <p className="siac-brand-title">SIAC-IA</p>
            <p className="siac-brand-subtitle">Evaluación y retroalimentación de código con inteligencia artificial</p>
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        <NotificationsMenu notifications={notifications} onOpen={onOpenNotifications} onClear={onClearNotifications} />
        <UserMenu displayName={displayName} onNavigate={onNavigate} />
      </div>
    </header>
  )
}

function WelcomeBanner({ displayName }: { displayName: string }) {
  return (
    <section className="welcome-banner">
      <div className="welcome-content">
        <p className="welcome-label">Espacio de aprendizaje</p>
        <h1>¡Hola, {displayName}!</h1>
        <p>
          Ingresa el enunciado y tu código fuente para recibir una evaluación y retroalimentación inmediata.
        </p>
        <div className="welcome-accent" />
      </div>

      <div className="ai-visual" aria-hidden="true">
        <div className="ai-grid" />
        <div className="ai-orbit ai-orbit-one" />
        <div className="ai-orbit ai-orbit-two" />
        <div className="ai-core">
          <BrainCircuit size={34} />
        </div>
        <span className="ai-node ai-node-one"><Code2 size={14} /></span>
        <span className="ai-node ai-node-two"><Sparkles size={14} /></span>
        <span className="ai-node ai-node-three"><MessageCircle size={14} /></span>
      </div>
    </section>
  )
}

function ViewHeader({ title, text }: { title: string; text: string }) {
  return (
    <section className="view-header">
      <h1>{title}</h1>
      <p>{text}</p>
    </section>
  )
}

function CodeEditor({ code, setCode, language, fileName, onFileUpload,}: { code: string; setCode: (value: string) => void; language: string; fileName: string; onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void}) {
  const lineCount = Math.max(code.split('\n').length, 12)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = () => {
    navigator.clipboard
      ?.writeText(code)
      .then(() => setCopied(true))
      .catch(() => undefined)
  }

  return (
    <div className="code-editor">
      <div className="editor-toolbar">
        <div className="editor-window-controls">
          <span className="window-dot dot-red" />
          <span className="window-dot dot-yellow" />
          <span className="window-dot dot-green" />
          <span className="editor-file-name">{fileName}</span>
        </div>

        <div className="editor-toolbar-actions">
          <button type="button" className="editor-action" onClick={handleCopy} disabled={!code}>
            {copied ? <><Check size={13} />Copiado</> : <><Copy size={13} />Copiar</>}
          </button>
          <button type="button" className="editor-action" onClick={() => fileInputRef.current?.click()}> <Upload size={13} />Cargar archivo</button>
          <input ref={fileInputRef} type="file" accept={(LANGUAGE_EXTENSIONS[language] ?? []).join(',')} className="hidden" onChange={onFileUpload}
          />

          <span className="editor-language-tag">{language}</span>
        </div>
      </div>

      <div className="editor-body">
        <div className="line-numbers">
          {Array.from({ length: lineCount }, (_, index) => <div key={index}>{index + 1}</div>)}
        </div>
        <textarea
          value={code}
          onChange={(event) => setCode(event.target.value)}
          spellCheck={false}
          aria-label="Editor de código"
          placeholder="# Escribe aquí tu solución..."
          className="code-textarea"
        />
      </div>
    </div>
  )
}

const benefits = [
  { title: 'Análisis del código', text: 'Detecta errores y posibles mejoras en tu solución.', icon: Code2, color: 'soft-red' },
  { title: 'Recomendaciones', text: 'Recibe sugerencias para mejorar la estructura y buenas prácticas.', icon: Lightbulb, color: 'soft-amber' },
  { title: 'Explicaciones claras', text: 'Entiende el porqué de cada observación y cómo corregirla.', icon: MessageCircle, color: 'soft-blue' },
  { title: 'Sin calificación automática', text: 'La herramienta te guía, el docente mantiene la decisión final.', icon: ShieldCheck, color: 'soft-green' },
]

function RightPanel() {
  return (
    <div className="right-panel">
      <section className="panel">
        <div className="panel-header">
          <div className="panel-icon"><Sparkles size={17} /></div>
          <div>
            <h2>¿Qué obtendrás?</h2>
            <p>Una guía para seguir aprendiendo.</p>
          </div>
        </div>

        <div className="benefit-list">
          {benefits.map(({ title, text, icon: Icon, color }) => (
            <div className="benefit-item" key={title}>
              <div className={`benefit-icon ${color}`}><Icon size={16} /></div>
              <div>
                <p className="benefit-title">{title}</p>
                <p className="benefit-text">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel panel-languages">
        <div className="panel-header compact-header">
          <div className="panel-icon panel-icon-soft"><Code2 size={17} /></div>
          <h2>Ejemplos de lenguajes soportados</h2>
        </div>
        <div className="language-list">
          {SUPPORTED_LANGUAGES.map((item) => (
            <span className="language-tag" key={item}>
              <span className="language-dot" />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="notice-card">
        <Lightbulb size={18} className="notice-icon" />
        <p>
          Recuerda: El código debe ser una solución individual y original. No está permitido copiar o hacer uso de IA para generar la respuesta.
        </p>
      </section>
    </div>
  )
}

function EvaluationResult({ status, data, isOutdated, errorMessage }: { status: EvaluationStatus; data: EvaluationResultData | null; isOutdated: boolean; errorMessage: string }) {
  if (status === 'evaluated' && data) {
    const details = data.feedbackDetails
    const practicesApplied = details?.goodPracticesApplied ?? []
    const practicesMissing = details?.goodPracticesMissing ?? []

    return (
      <section className={`result-panel ${data.isCompliant ? 'result-success' : 'result-attention'}`} aria-live="polite">
        <div className="result-icon-wrap">
          {data.isCompliant ? <CheckCircle2 size={19} className="text-[#3b8874]" /> : <AlertCircle size={19} className="text-[#b56b24]" />}
        </div>
        <div>
          <p className="result-title">
            {data.isCompliant ? 'Tu solución cumple con el enunciado' : 'Tu solución aún no cumple con el enunciado'}
          </p>
          <p className="result-copy">{data.summary}</p>

          {data.mode === 'mock' && (
            <p className="result-mode-badge">Modo de prueba · sin IA</p>
          )}

          {data.requirements.length > 0 && (
            <ul className="requirement-list">
              {data.requirements.map((requirement, index) => (
                <li key={index} className={requirement.met ? 'requirement-met' : 'requirement-unmet'}>
                  {requirement.met ? <CheckCircle2 size={14} /> : <X size={14} />}
                  <div>
                    <p className="requirement-title">{requirement.description}</p>
                    <p className="requirement-evidence">{requirement.evidence}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {details && (
            <ul className="result-details">
              {details.logic && <li><strong>Lógica:</strong> {details.logic}</li>}
              {details.structure && <li><strong>Estructura:</strong> {details.structure}</li>}
              {practicesApplied.length > 0 && <li><strong>Buenas prácticas aplicadas:</strong> {practicesApplied.join(', ')}</li>}
              {practicesMissing.length > 0 && <li><strong>Buenas prácticas por mejorar:</strong> {practicesMissing.join(', ')}</li>}
            </ul>
          )}

          {isOutdated && (
            <p className="result-outdated">
              Modificaste el enunciado o el código después de esta evaluación. Envíalo de nuevo para actualizar el resultado.
            </p>
          )}
        </div>
      </section>
    )
  }

  if (status === 'error') {
    return (
      <section className="result-panel result-attention" aria-live="polite">
        <div className="result-icon-wrap"><AlertCircle size={19} className="text-[#b56b24]" /></div>
        <div>
          <p className="result-title">No se pudo completar la evaluación</p>
          <p className="result-copy">{errorMessage}</p>
        </div>
      </section>
    )
  }

  if (status === 'invalid') {
    return (
      <section className="result-panel result-attention" aria-live="polite">
        <div className="result-icon-wrap"><AlertCircle size={19} className="text-[#b56b24]" /></div>
        <div>
          <p className="result-title">Hay algunos aspectos por revisar</p>
          <p className="result-copy">Revisa los campos marcados antes de enviar tu solución para evaluación.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="result-panel result-idle">
      <div className="result-icon-wrap"><Sparkles size={18} className="text-slate-500" /></div>
      <div>
        <p className="result-title">Resultado de la evaluación</p>
        <p className="result-copy">Escribe el enunciado y tu código, y envíalos para saber si tu solución cumple con lo solicitado.</p>
      </div>
    </section>
  )
}

const LANGUAGE_EXTENSIONS: Record<string, string[]> = {
  Python: ['.py'],
  JavaScript: ['.js'],
  Java: ['.java'],
  'C++': ['.cpp', '.cc'],
  C: ['.c'],
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settings, setSettings] = useState<UserSettings>(loadSettings)
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [activeNav, setActiveNav] = useState<NavId>('inicio')
  const statementRef = useRef<HTMLTextAreaElement>(null)
  const pendingFocus = useRef(false)

  const [statement, setStatement] = useState(() => (settings.saveDraft ? loadDraft() : ''))
  useEffect(() => {
    if (settings.saveDraft) saveDraft(statement)
    else clearDraft()
  }, [statement, settings.saveDraft])

  useEffect(() => saveSettings(settings), [settings])
  useEffect(() => saveHistory(history), [history])

  const [language, setLanguage] = useState(settings.defaultLanguage)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<EvaluationStatus>('idle')
  const [isLoading, setIsLoading] = useState(false)
  const [isOutdated, setIsOutdated] = useState(false)
  const [evaluationError, setEvaluationError] = useState('')
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [evaluationData, setEvaluationData] = useState<EvaluationResultData | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [fileError, setFileError] = useState('')

  const fileName = uploadedFileName ?? `solution${LANGUAGE_EXTENSIONS[language]?.[0] ?? '.txt'}`

  const handleClear = () => {
    setStatement('')
    setCode('')
    setLanguage(settings.defaultLanguage)
    setUploadedFileName(null)
    setFileError('')
    setErrors({})
    setStatus('idle')
    setEvaluationData(null)
    setEvaluationError('')
    setIsOutdated(false)
  }

  const handleNavigate = (id: NavId) => {
    setActiveNav(id)
    setSidebarOpen(false)
    if (id === 'evaluar') pendingFocus.current = true
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // "Evaluar código" lleva al formulario una vez que la vista de evaluación está en pantalla.
  useEffect(() => {
    if (activeNav !== 'evaluar' || !pendingFocus.current) return
    pendingFocus.current = false
    statementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    statementRef.current?.focus({ preventScroll: true })
  })

  const notify = (notification: Omit<AppNotification, 'id' | 'date' | 'read'>) => {
    setNotifications((current) => [
      { ...notification, id: crypto.randomUUID(), date: new Date().toISOString(), read: false },
      ...current,
    ].slice(0, MAX_NOTIFICATIONS))
  }

  const handleOpenHistoryEntry = (entry: HistoryEntry) => {
    setStatement(entry.statement)
    setCode(entry.code)
    setLanguage(entry.language)
    setUploadedFileName(entry.fileName)
    setErrors({})
    setFileError('')
    setEvaluationError('')
    setEvaluationData(entry.result)
    setStatus('evaluated')
    setIsOutdated(false)
    handleNavigate('evaluar')
  }

  const handleClearLocalData = () => {
    clearAllLocalData()
    setHistory([])
    setSettings(DEFAULT_SETTINGS)
  }

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = LANGUAGE_EXTENSIONS[language] ?? []

    if (!allowedExtensions.includes(extension)) {
      setFileError(
        `El archivo debe tener una extensión válida para ${language} (${allowedExtensions.join(', ')}).`
      )
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCode(content)
      setUploadedFileName(file.name)
      setFileError('')
      setErrors((current) => ({ ...current, code: undefined }))
      setIsOutdated(true)
    }
    reader.onerror = () => {
      setFileError('No se pudo leer el archivo. Intenta nuevamente.')
    }
    reader.readAsText(file)

    event.target.value = '' // permite volver a cargar el mismo archivo si es necesario
  }

  const handleEvaluate = async () => {
    const nextErrors = validateEvaluationInput(statement, code)
    setErrors(nextErrors)
    setEvaluationError('')

    if (Object.keys(nextErrors).length > 0) {
      setStatus('invalid')
      setEvaluationData(null)
      return
    }

    setIsLoading(true)

    try {
      const result = await analyzeCodeCompliance({
        statement,
        code,
        language,
      })

      setEvaluationData(result)
      setIsOutdated(false)
      setStatus('evaluated')

      if (settings.saveHistory) {
        const entry = createHistoryEntry({ statement, code, language, fileName: uploadedFileName, result })
        setHistory((current) => [entry, ...current].slice(0, MAX_HISTORY_ENTRIES))
      }
      notify(
        result.isCompliant
          ? { kind: 'success', title: 'Tu solución cumple', text: `Evaluación en ${language} completada.` }
          : { kind: 'attention', title: 'Tu solución aún no cumple', text: `Revisa los requisitos pendientes de tu código en ${language}.` },
      )
    } catch (error) {
      console.error('Error durante la evaluación:', error)
      setEvaluationData(null)
      const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado. Intenta nuevamente.'
      setEvaluationError(message)
      setStatus('error')
      notify({ kind: 'error', title: 'No se pudo completar la evaluación', text: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeNav={activeNav}
        onNavigate={handleNavigate}
        displayName={settings.displayName}
      />

      <div className="main-panel">
        <Header
          onMenu={() => setSidebarOpen(true)}
          displayName={settings.displayName}
          notifications={notifications}
          onOpenNotifications={() => setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))}
          onClearNotifications={() => setNotifications([])}
          onNavigate={handleNavigate}
        />

        <main className="main-content">
          {activeNav === 'inicio' || activeNav === 'evaluar' ? (
          <>
          <WelcomeBanner displayName={settings.displayName} />

          <div className="content-grid">
            <div className="content-main-column">
              <section className="panel content-card">
                <div className="card-header-row">
                  <div className="card-title-wrap">
                    <div className="panel-icon"><FileText size={18} /></div>
                    <div>
                      <h2>1. Enunciado del ejercicio</h2>
                      <p>Describe qué debe resolver tu código.</p>
                    </div>
                  </div>
                  <span className="counter-badge">{statement.length}/2000</span>
                </div>

                <textarea
                  ref={statementRef}
                  maxLength={2000}
                  value={statement}
                  onChange={(event) => {
                    setStatement(event.target.value)
                    setErrors((current) => ({ ...current, statement: undefined }))
                    setIsOutdated(true)
                  }}
                  placeholder="Escribe aquí el enunciado del ejercicio..."
                  className={`input-field ${errors.statement ? 'input-error' : ''}`}
                />

                <span className="counter-badge mobile-counter">{statement.length}/2000</span>

                {!errors.statement && statement.trim().length > 0 && statement.trim().length < MIN_STATEMENT_LENGTH && (
                  <p className="field-hint">
                    Escribe {MIN_STATEMENT_LENGTH - statement.trim().length} caracteres más para completar el enunciado.
                    </p>
                  )}
                  
                {errors.statement && (
                  <p className="field-error">
                    <AlertCircle size={14} />{errors.statement}
                  </p>
                )}
              </section>

              <section className="panel content-card">
                <div className="card-header-row code-header-row">
                  <div className="card-title-wrap">
                    <div className="panel-icon"><Code2 size={18} /></div>
                    <div>
                      <h2>2. Código fuente</h2>
                      <p>Escribe una solución clara y ordenada.</p>
                    </div>
                  </div>

                  <label className="language-select">
                    <span>Lenguaje</span>
                    <select value={language} onChange={(event) => {
                      setLanguage(event.target.value)
                      setFileError('')
                      setIsOutdated(true)
                    }} aria-label="Seleccionar lenguaje">
                      {SUPPORTED_LANGUAGES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                    <ChevronDown size={14} className="select-chevron" />
                  </label>
                </div>

                <CodeEditor
                  code={code}
                  setCode={(value) => {
                    setCode(value)
                    setErrors((current) => ({ ...current, code: undefined }))
                    setIsOutdated(true)
                  }}
                  language={language}
                  fileName={fileName}
                  onFileUpload={handleFileUpload}
                />

                {errors.code && (
                  <p className="field-error">
                    <AlertCircle size={14} />{errors.code}
                  </p>
                )}

                {fileError && (
                  <p className="field-error">
                    <AlertCircle size={14} />{fileError}
                  </p>
                )}

                <div className="action-row">
                  <button type="button" className="secondary-button" onClick={handleClear} disabled={isLoading}>
                    <Trash2 size={15} />Limpiar
                  </button>
                  <button type="button" onClick={handleEvaluate} disabled={isLoading} className="primary-button">
                    {isLoading ? (
                      <>
                        <LoaderCircle size={16} className="animate-spin" />Analizando...
                      </>
                    ) : (
                      <>
                        <Send size={15} />Enviar para evaluación
                      </>
                    )}
                  </button>
                </div>
              </section>

              <EvaluationResult status={status} data={evaluationData} isOutdated={isOutdated} errorMessage={evaluationError} />
            </div>

            <RightPanel />
          </div>
          </>
          ) : (
            <div className="view-container">
              <ViewHeader {...viewTitles[activeNav]} />
              {activeNav === 'historial' && (
                <HistoryView
                  entries={history}
                  saveHistoryEnabled={settings.saveHistory}
                  onOpen={handleOpenHistoryEntry}
                  onDelete={(id) => setHistory((current) => current.filter((entry) => entry.id !== id))}
                  onClearAll={() => setHistory([])}
                  onGoToSettings={() => handleNavigate('configuracion')}
                />
              )}
              {activeNav === 'recursos' && <ResourcesView />}
              {activeNav === 'configuracion' && (
                <SettingsView settings={settings} onChange={setSettings} onClearLocalData={handleClearLocalData} />
              )}
            </div>
          )}
        </main>

        <footer className="footer">
          <span className="footer-brand">SIAC-IA <span>|</span> Universidad Francisco de Paula Santander</span>
          <span>San José de Cúcuta <span>·</span> 2026</span>
        </footer>
      </div>
    </div>
  )
}

export default App
