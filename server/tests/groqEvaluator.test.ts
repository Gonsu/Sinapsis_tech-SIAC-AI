import assert from 'node:assert/strict'
import { afterEach, describe, it, mock } from 'node:test'
import { GroqEvaluator } from '../evaluators/groqEvaluator.ts'
import { input, jsonResponse, mockFetch, validEvaluation } from './fakeResponses.ts'

const groqReply = (content: string, finishReason = 'stop') =>
  jsonResponse(200, {
    id: 'prueba',
    object: 'chat.completion',
    choices: [{ index: 0, finish_reason: finishReason, message: { role: 'assistant', content } }],
  })

const groqError = (status: number, code = 'error') =>
  jsonResponse(status, { error: { message: 'error', type: 'invalid_request_error', code } })

// El SDK de Groq toma fetch al crearse, por eso el evaluador se crea después de simularlo.
const createEvaluator = () => new GroqEvaluator({ apiKey: 'clave-de-prueba', model: 'modelo-de-prueba' })

describe('GroqEvaluator', () => {
  afterEach(() => mock.restoreAll())

  it('devuelve el análisis cuando la respuesta respeta el esquema', async () => {
    const fetchMock = mockFetch(() => groqReply(JSON.stringify(validEvaluation)))

    const result = await createEvaluator().evaluate(input)

    assert.deepEqual(result, { mode: 'ai', ...validEvaluation })
    const body = JSON.parse(String((fetchMock.mock.calls[0].arguments[1] as RequestInit).body))
    assert.equal(body.model, 'modelo-de-prueba')
    assert.equal(body.response_format.type, 'json_schema')
  })

  it('reintenta cuando Groq rechaza el JSON generado (json_validate_failed)', async () => {
    const fetchMock = mockFetch(() => groqError(400, 'json_validate_failed'), () => groqReply(JSON.stringify(validEvaluation)))

    const result = await createEvaluator().evaluate(input)

    assert.equal(result.isCompliant, true)
    assert.equal(fetchMock.mock.callCount(), 2)
  })

  it('reintenta cuando el contenido no respeta el esquema y se rinde tras 3 intentos', async () => {
    const fetchMock = mockFetch(() => groqReply(JSON.stringify({ isCompliant: 'sí' })))

    await assert.rejects(createEvaluator().evaluate(input), /formato esperado/)
    assert.equal(fetchMock.mock.callCount(), 3)
  })

  it('no reintenta otros errores de la API', async () => {
    const fetchMock = mockFetch(() => groqError(401))

    await assert.rejects(createEvaluator().evaluate(input), /clave de la API de Groq/)
    assert.equal(fetchMock.mock.callCount(), 1)
  })

  it('informa el límite de solicitudes (429) sin reintentar', async () => {
    const fetchMock = mockFetch(() => groqError(429))

    await assert.rejects(createEvaluator().evaluate(input), /límite de solicitudes/)
    assert.equal(fetchMock.mock.callCount(), 1)
  })

  it('rechaza una respuesta cortada por límite de tokens', async () => {
    mockFetch(() => groqReply('{"isCompliant": tr', 'length'))
    await assert.rejects(createEvaluator().evaluate(input), /incompleta/)
  })
})
