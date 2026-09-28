import type { EvaluationInput, EvaluationResultData } from '../../shared/evaluation.ts'

const REQUEST_TIMEOUT_MS = 120_000

// RF-3: envía el enunciado y el código al servidor Express, que hace el análisis (RF-5).
export async function analyzeCodeCompliance(input: EvaluationInput): Promise<EvaluationResultData> {
  let response: Response
  try {
    response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error('El análisis tardó demasiado. Intenta nuevamente.', { cause: error })
    }
    throw new Error('No se pudo conectar con el servidor de evaluación. Verifica que esté en ejecución (npm run dev).', { cause: error })
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = typeof data?.error === 'string' ? data.error : `El servidor respondió con un error (${response.status}).`
    throw new Error(message)
  }

  return data as EvaluationResultData
}
