import { mock } from 'node:test'

// Utilidades para simular las respuestas de los servicios de IA sin hacer llamadas reales.

export const input = {
  statement: 'Escriba una función que calcule el promedio de una lista de números.',
  code: 'def calcular_promedio(lista):\n    return sum(lista) / len(lista)',
  language: 'Python',
}

export const validEvaluation = {
  isCompliant: true,
  summary: 'La solución cumple con el enunciado.',
  requirements: [{ description: 'Calcular el promedio', met: true, evidence: 'return sum(lista) / len(lista)' }],
  feedbackDetails: {
    logic: 'Correcta.',
    structure: 'Clara.',
    goodPracticesApplied: ['Uso de sum y len'],
    goodPracticesMissing: [],
  },
}

export const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Reemplaza fetch global por respuestas en secuencia (la última se repite). Devuelve el mock para contar llamadas. */
export const mockFetch = (...responses: (() => Response)[]) => {
  let call = 0
  return mock.method(globalThis, 'fetch', async () => responses[Math.min(call++, responses.length - 1)]())
}
