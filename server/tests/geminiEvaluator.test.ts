import assert from 'node:assert/strict'
import { afterEach, describe, it, mock } from 'node:test'
import { GeminiEvaluator } from '../evaluators/geminiEvaluator.ts'
import { EvaluationError } from '../evaluators/types.ts'
import { input, jsonResponse, mockFetch, validEvaluation } from './fakeResponses.ts'

const geminiReply = (text: string, finishReason = 'STOP') =>
  jsonResponse(200, { candidates: [{ finishReason, content: { parts: [{ text }] } }] })

const geminiError = (status: number, message = 'error') => jsonResponse(status, { error: { code: status, message } })

const createEvaluator = () => new GeminiEvaluator({ apiKey: 'clave-de-prueba', model: 'modelo-de-prueba', retryDelaysMs: [0, 0] })

describe('GeminiEvaluator', () => {
  afterEach(() => mock.restoreAll())

  it('devuelve el análisis cuando la respuesta respeta el esquema', async () => {
    const fetchMock = mockFetch(() => geminiReply(JSON.stringify(validEvaluation)))

    const result = await createEvaluator().evaluate(input)

    assert.deepEqual(result, { mode: 'ai', ...validEvaluation })
    const [url, init] = fetchMock.mock.calls[0].arguments as [string, RequestInit]
    assert.match(url, /modelo-de-prueba:generateContent$/)
    assert.equal((init.headers as Record<string, string>)['x-goog-api-key'], 'clave-de-prueba')
  })

  it('reintenta cuando el modelo está saturado (503)', async () => {
    const fetchMock = mockFetch(() => geminiError(503), () => geminiReply(JSON.stringify(validEvaluation)))

    const result = await createEvaluator().evaluate(input)

    assert.equal(result.isCompliant, true)
    assert.equal(fetchMock.mock.callCount(), 2)
  })

  it('informa la saturación si persiste después de los reintentos', async () => {
    const fetchMock = mockFetch(() => geminiError(503))

    await assert.rejects(createEvaluator().evaluate(input), (error: EvaluationError) => {
      assert.equal(error.status, 503)
      assert.match(error.message, /saturado/)
      return true
    })
    assert.equal(fetchMock.mock.callCount(), 3)
  })

  for (const [status, expected] of [
    [402, /créditos/],
    [403, /clave de la API de Gemini/],
    [429, /límite de solicitudes/],
    [404, /configuración del modelo/],
  ] as const) {
    it(`convierte el error HTTP ${status} en un mensaje para el estudiante`, async () => {
      mockFetch(() => geminiError(status))
      await assert.rejects(createEvaluator().evaluate(input), expected)
    })
  }

  it('rechaza una respuesta que no respeta el esquema', async () => {
    mockFetch(() => geminiReply(JSON.stringify({ isCompliant: 'sí' })))
    await assert.rejects(createEvaluator().evaluate(input), /formato esperado/)
  })

  it('rechaza una respuesta cortada por límite de tokens', async () => {
    mockFetch(() => geminiReply('{"isCompliant": tr', 'MAX_TOKENS'))
    await assert.rejects(createEvaluator().evaluate(input), /incompleta/)
  })
})
