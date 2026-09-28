import type { EvaluationInput, EvaluationResultData } from '../../shared/evaluation.ts'

// RF-5: cualquier motor de análisis (IA real o simulador) implementa esta interfaz.
export interface CodeEvaluator {
  readonly mode: EvaluationResultData['mode']
  /** Proveedor y modelo de IA, para mostrarlos en /api/health. */
  readonly provider?: string
  readonly model?: string
  evaluate(input: EvaluationInput): Promise<EvaluationResultData>
}

/** Error con un mensaje apto para mostrar al estudiante y el código HTTP a devolver. */
export class EvaluationError extends Error {
  readonly status: number

  constructor(message: string, status = 502) {
    super(message)
    this.name = 'EvaluationError'
    this.status = status
  }
}
