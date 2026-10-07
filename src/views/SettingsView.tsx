import { useEffect, useState } from 'react'
import { BrainCircuit, Server, Settings as SettingsIcon, Trash2 } from 'lucide-react'
import { LanguageSelect } from '../components/LanguageSelect'
import type { Settings } from '../services/localData'

type HealthResponse = { mode: 'ai' | 'mock'; provider?: string; model?: string }
type ServerStatus = { state: 'loading' } | ({ state: 'online' } & HealthResponse) | { state: 'offline' }

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="settings-row settings-toggle-row">
      <div>
        <p className="settings-label">{label}</p>
        <p className="settings-description">{description}</p>
      </div>
      <input type="checkbox" role="switch" className="toggle-switch" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}

export function SettingsView({
  settings,
  onChange,
  onClearLocalData,
}: {
  settings: Settings
  onChange: (settings: Settings) => void
  onClearLocalData: () => void
}) {
  const [serverStatus, setServerStatus] = useState<ServerStatus>({ state: 'loading' })
  const update = (patch: Partial<Settings>) => onChange({ ...settings, ...patch })

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/health', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data: HealthResponse) => setServerStatus({ state: 'online', mode: data.mode, provider: data.provider, model: data.model }))
      .catch(() => {
        if (!controller.signal.aborted) setServerStatus({ state: 'offline' })
      })
    return () => controller.abort()
  }, [])

  return (
    <div className="view-stack">
      <section className="panel content-card view-card">
        <div className="card-header-row">
          <div className="card-title-wrap">
            <div className="panel-icon"><SettingsIcon size={18} /></div>
            <div>
              <h2>Preferencias</h2>
              <p>Se guardan en este navegador.</p>
            </div>
          </div>
        </div>

        <div className="settings-list">
          <label className="settings-row">
            <div>
              <p className="settings-label">Nombre para mostrar</p>
              <p className="settings-description">Aparece en el saludo y en el menú de usuario.</p>
            </div>
            <input
              type="text"
              className="settings-input"
              maxLength={40}
              value={settings.displayName}
              onChange={(event) => update({ displayName: event.target.value })}
              onBlur={() => {
                if (!settings.displayName.trim()) update({ displayName: 'Estudiante' })
              }}
            />
          </label>

          <label className="settings-row">
            <div>
              <p className="settings-label">Lenguaje predeterminado</p>
              <p className="settings-description">Se selecciona al abrir la app y al limpiar el formulario.</p>
            </div>
            <LanguageSelect label={false} value={settings.defaultLanguage} onChange={(defaultLanguage) => update({ defaultLanguage })} />
          </label>

          <ToggleRow
            label="Guardar historial de evaluaciones"
            description="Registra cada evaluación para consultarla después en Historial."
            checked={settings.saveHistory}
            onChange={(saveHistory) => update({ saveHistory })}
          />

          <ToggleRow
            label="Guardar borrador del enunciado"
            description="Conserva el enunciado aunque cierres o recargues la página."
            checked={settings.saveDraft}
            onChange={(saveDraft) => update({ saveDraft })}
          />
        </div>
      </section>

      <section className="panel content-card view-card">
        <div className="card-header-row">
          <div className="card-title-wrap">
            <div className="panel-icon"><Server size={18} /></div>
            <div>
              <h2>Servicio de evaluación</h2>
              <p>Estado del servidor que analiza tu código.</p>
            </div>
          </div>
        </div>

        <div className="server-status">
          <BrainCircuit size={18} />
          {serverStatus.state === 'loading' && <p>Consultando el estado del servidor…</p>}
          {serverStatus.state === 'offline' && (
            <p><span className="status-dot status-offline" />Sin conexión con el servidor. Verifica que esté en ejecución (<code>npm run dev</code>).</p>
          )}
          {serverStatus.state === 'online' && serverStatus.mode === 'ai' && (
            <p><span className="status-dot status-online" />Conectado · Análisis con inteligencia artificial activo{serverStatus.provider && <> ({serverStatus.provider}{serverStatus.model && <> · <code>{serverStatus.model}</code></>})</>}.</p>
          )}
          {serverStatus.state === 'online' && serverStatus.mode === 'mock' && (
            <p><span className="status-dot status-mock" />Conectado · Modo de prueba (sin IA). Configura una clave de IA (<code>GROQ_API_KEY</code>, <code>GEMINI_API_KEY</code> o <code>ANTHROPIC_API_KEY</code>) en el servidor para activar la IA.</p>
          )}
        </div>
      </section>

      <section className="panel content-card view-card">
        <div className="card-header-row">
          <div className="card-title-wrap">
            <div className="panel-icon"><Trash2 size={18} /></div>
            <div>
              <h2>Datos guardados</h2>
              <p>Elimina el historial, el borrador y las preferencias de este navegador.</p>
            </div>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              if (window.confirm('¿Borrar todos los datos guardados en este navegador? Esta acción no se puede deshacer.')) onClearLocalData()
            }}
          >
            <Trash2 size={15} />Borrar datos
          </button>
        </div>
      </section>
    </div>
  )
}
