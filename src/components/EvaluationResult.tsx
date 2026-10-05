import { AlertCircle, CheckCircle2, Sparkles, X } from 'lucide-react'
import type { EvaluationResultData } from '../../shared/evaluation.ts'

export type EvaluationStatus = 'idle' | 'invalid' | 'error' | 'evaluated'

interface EvaluationResultProps {
  status: EvaluationStatus
  data: EvaluationResultData | null
  isOutdated: boolean
  errorMessage: string
}

export function EvaluationResult({ status, data, isOutdated, errorMessage }: EvaluationResultProps) {
  if (status === 'evaluated' && data) {
    const details = data.feedbackDetails
    const practicesApplied = details?.goodPracticesApplied ?? []
    const practicesMissing = details?.goodPracticesMissing ?? []

    return (
      <section className={`result-panel ${data.isCompliant ? 'result-success' : 'result-attention'}`} aria-live="polite">
        <div className="result-icon-wrap">
          {data.isCompliant ? (
            <CheckCircle2 size={19} className="text-[#3b8874]" />
          ) : (
            <AlertCircle size={19} className="text-[#b56b24]" />
          )}
        </div>
        <div>
          <p className="result-title">
            {data.isCompliant ? 'Tu solución cumple con el enunciado' : 'Tu solución aún no cumple con el enunciado'}
          </p>
          <p className="result-copy">{data.summary}</p>

          {data.mode === 'mock' && <p className="result-mode-badge">Modo de prueba · sin IA</p>}

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
              {details.logic && (
                <li>
                  <strong>Lógica:</strong> {details.logic}
                </li>
              )}
              {details.structure && (
                <li>
                  <strong>Estructura:</strong> {details.structure}
                </li>
              )}
              {practicesApplied.length > 0 && (
                <li>
                  <strong>Buenas prácticas aplicadas:</strong> {practicesApplied.join(', ')}
                </li>
              )}
              {practicesMissing.length > 0 && (
                <li>
                  <strong>Buenas prácticas por mejorar:</strong> {practicesMissing.join(', ')}
                </li>
              )}
            </ul>
          )}

          {isOutdated && (
            <p className="result-outdated">
              Modificaste el enunciado o el código después de esta evaluación. Envíalo de nuevo para actualizar el
              resultado.
            </p>
          )}
        </div>
      </section>
    )
  }

  if (status === 'error') {
    return (
      <section className="result-panel result-attention" aria-live="polite">
        <div className="result-icon-wrap">
          <AlertCircle size={19} className="text-[#b56b24]" />
        </div>
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
        <div className="result-icon-wrap">
          <AlertCircle size={19} className="text-[#b56b24]" />
        </div>
        <div>
          <p className="result-title">Hay algunos aspectos por revisar</p>
          <p className="result-copy">Revisa los campos marcados antes de enviar tu solución para evaluación.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="result-panel result-idle">
      <div className="result-icon-wrap">
        <Sparkles size={18} className="text-slate-500" />
      </div>
      <div>
        <p className="result-title">Resultado de la evaluación</p>
        <p className="result-copy">
          Escribe el enunciado y tu código, y envíalos para saber si tu solución cumple con lo solicitado.
        </p>
      </div>
    </section>
  )
}
