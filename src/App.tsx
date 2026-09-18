import { useState } from 'react'
import {
  AlertCircle,
  Bell,
  BookOpen,
  BrainCircuit,
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
import { analyzeCodeCompliance, type EvaluationResultData } from './services/evaluationService'
import './App.css'

type EvaluationStatus = 'idle' | 'success' | 'attention'

const navigation = [
  { label: 'Inicio', icon: LayoutDashboard, active: true },
  { label: 'Evaluar código', icon: Code2, active: false },
  { label: 'Historial', icon: History, active: false },
  { label: 'Recursos', icon: BookOpen, active: false },
  { label: 'Configuración', icon: Settings, active: false },
]

function SiacMark({ light = false, className = '' }: { light?: boolean; className?: string }) {
  return (
    <div className={`siac-mark ${className} ${light ? 'siac-mark-light' : ''}`}>
      <BrainCircuit size={22} strokeWidth={1.8} />
    </div>
  )
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
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
          {navigation.map(({ label, icon: Icon, active }) => (
            <button key={label} className={`nav-item ${active ? 'nav-item-active' : ''}`} onClick={onClose}>
              <span className="nav-item-icon"><Icon size={18} strokeWidth={active ? 2.2 : 1.8} /></span>
              <span>{label}</span>
              {active && <span className="nav-item-dot" />}
            </button>
          ))}
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

        <div className="sidebar-user">
          <div className="avatar avatar-sidebar">
            <UserRound size={16} />
          </div>
          <div className="sidebar-user-copy">
            <p>Juan David Pérez</p>
            <span>Estudiante</span>
          </div>
          <ChevronDown size={15} className="sidebar-user-chevron" />
        </div>
      </aside>
    </>
  )
}

function Header({ onMenu }: { onMenu: () => void }) {
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
        <button className="notification-button" aria-label="Notificaciones">
          <Bell size={19} />
          <span />
        </button>
        <div className="avatar avatar-header">
          <UserRound size={16} />
        </div>
        <span className="user-name">Estudiante</span>
        <ChevronDown size={15} className="user-chevron" />
      </div>
    </header>
  )
}

function WelcomeBanner() {
  return (
    <section className="welcome-banner">
      <div className="welcome-content">
        <p className="welcome-label">Espacio de aprendizaje</p>
        <h1>¡Hola, Estudiante!</h1>
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

function CodeEditor({ code, setCode, language }: { code: string; setCode: (value: string) => void; language: string }) {
  const lineCount = Math.max(code.split('\n').length, 12)

  return (
    <div className="code-editor">
      <div className="editor-toolbar">
        <div className="editor-window-controls">
          <span className="window-dot dot-red" />
          <span className="window-dot dot-yellow" />
          <span className="window-dot dot-green" />
          <span className="editor-file-name">solution.py</span>
        </div>

        <div className="editor-toolbar-actions">
          <button type="button" className="editor-action"><Copy size={13} />Copiar</button>
          <button type="button" className="editor-action"><Upload size={13} />Cargar archivo</button>
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
          {['Python', 'JavaScript', 'Java', 'C++', 'C'].map((item) => (
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

function EvaluationResult({ status, data }: { status: EvaluationStatus; data: EvaluationResultData | null }) {
  const isAttention = status === 'attention'

  return (
    <section className={`result-panel ${isAttention ? 'result-attention' : status === 'success' ? 'result-success' : 'result-idle'}`}>
      <div className="result-icon-wrap">
        {status === 'idle' ? <Sparkles size={18} className="text-slate-500" /> : isAttention ? <AlertCircle size={19} className="text-[#b56b24]" /> : <CheckCircle2 size={19} className="text-[#3b8874]" />}
      </div>
      <div>
        <p className="result-title">{status === 'idle' ? 'Resultado de evaluación' : isAttention ? 'Hay algunos aspectos por revisar' : 'El código cumple con los requisitos'}</p>
        <p className="result-copy">{data ? data.summary : 'Aquí aparecerán las observaciones para orientar tu aprendizaje.'}</p>
      </div>
    </section>
  )
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statement, setStatement] = useState('')
  const [language, setLanguage] = useState('Python')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<EvaluationStatus>('idle')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({ statement: false, code: false })
  const [evaluationData, setEvaluationData] = useState<EvaluationResultData | null>(null)

  const handleEvaluate = async () => {
    const nextErrors = { statement: !statement.trim(), code: !code.trim() }
    setErrors(nextErrors)
    if (nextErrors.statement || nextErrors.code) return
    setIsLoading(true)
    try {
      const result = await analyzeCodeCompliance({
        statement,
        code,
        language,
      })

      setEvaluationData(result)
      setStatus(result.isCompliant ? 'success' : 'attention')
    } catch (error) {
      console.error('Error durante la evaluación:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-panel">
        <Header onMenu={() => setSidebarOpen(true)} />

        <main className="main-content">
          <WelcomeBanner />

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
                  maxLength={2000}
                  value={statement}
                  onChange={(event) => {
                    setStatement(event.target.value)
                    setErrors((current) => ({ ...current, statement: false }))
                  }}
                  placeholder="Escribe aquí el enunciado del ejercicio..."
                  className={`input-field ${errors.statement ? 'input-error' : ''}`}
                />

                <span className="counter-badge mobile-counter">{statement.length}/2000</span>

                {errors.statement && (
                  <p className="field-error">
                    <AlertCircle size={14} />Ingresa el enunciado para continuar.
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
                    <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Seleccionar lenguaje">
                      <option>Python</option>
                      <option>JavaScript</option>
                      <option>Java</option>
                      <option>C++</option>
                      <option>C</option>
                    </select>
                    <ChevronDown size={14} className="select-chevron" />
                  </label>
                </div>

                <CodeEditor
                  code={code}
                  setCode={(value) => {
                    setCode(value)
                    setErrors((current) => ({ ...current, code: false }))
                  }}
                  language={language}
                />

                {errors.code && (
                  <p className="field-error">
                    <AlertCircle size={14} />Ingresa tu código para solicitar la evaluación.
                  </p>
                )}

                <div className="action-row">
                  <button type="button" className="secondary-button">
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

              <EvaluationResult status={status} data={evaluationData} />
            </div>

            <RightPanel />
          </div>
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
