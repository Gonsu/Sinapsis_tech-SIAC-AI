import { AlertCircle, CheckCircle2, FolderOpen, History, Trash2 } from 'lucide-react'
import { MAX_HISTORY_ENTRIES, type HistoryEntry } from '../services/localData'

const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

const preview = (text: string, max = 160) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text)

export function HistoryView({
  entries,
  saveHistoryEnabled,
  onOpen,
  onDelete,
  onClearAll,
  onGoToSettings,
}: {
  entries: HistoryEntry[]
  saveHistoryEnabled: boolean
  onOpen: (entry: HistoryEntry) => void
  onDelete: (id: string) => void
  onClearAll: () => void
  onGoToSettings: () => void
}) {
  return (
    <section className="panel content-card view-card">
      <div className="card-header-row">
        <div className="card-title-wrap">
          <div className="panel-icon"><History size={18} /></div>
          <div>
            <h2>Historial de evaluaciones</h2>
            <p>
              {entries.length > 0
                ? `${entries.length} evaluación(es) guardada(s) en este navegador (máximo ${MAX_HISTORY_ENTRIES}).`
                : 'Las evaluaciones se guardan en este navegador.'}
            </p>
          </div>
        </div>
        {entries.length > 0 && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              if (window.confirm('¿Borrar todo el historial? Esta acción no se puede deshacer.')) onClearAll()
            }}
          >
            <Trash2 size={15} />Borrar historial
          </button>
        )}
      </div>

      {!saveHistoryEnabled && (
        <p className="view-notice">
          El guardado del historial está desactivado.{' '}
          <button type="button" className="link-button" onClick={onGoToSettings}>Actívalo en Configuración</button>{' '}
          para registrar tus próximas evaluaciones.
        </p>
      )}

      {entries.length === 0 ? (
        <div className="empty-state">
          <History size={28} />
          <p className="empty-state-title">Aún no tienes evaluaciones</p>
          <p>Cuando envíes una solución para evaluación, aparecerá aquí para que puedas revisarla de nuevo.</p>
        </div>
      ) : (
        <ul className="history-list">
          {entries.map((entry) => (
            <li key={entry.id} className="history-item">
              <div className="history-item-main">
                <div className="history-item-meta">
                  <span className={`verdict-badge ${entry.result.isCompliant ? 'verdict-met' : 'verdict-unmet'}`}>
                    {entry.result.isCompliant ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {entry.result.isCompliant ? 'Cumple' : 'No cumple'}
                  </span>
                  <span className="language-tag history-language">{entry.language}</span>
                  <span className="history-date">{dateFormatter.format(new Date(entry.date))}</span>
                  {entry.result.mode === 'mock' && <span className="history-mode">Modo de prueba</span>}
                </div>
                <p className="history-statement">{preview(entry.statement)}</p>
              </div>

              <div className="history-item-actions">
                <button type="button" className="secondary-button compact-button" onClick={() => onOpen(entry)}>
                  <FolderOpen size={14} />Abrir
                </button>
                <button
                  type="button"
                  className="icon-button danger-icon-button"
                  onClick={() => onDelete(entry.id)}
                  aria-label="Eliminar evaluación del historial"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
