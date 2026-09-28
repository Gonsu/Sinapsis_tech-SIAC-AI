import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { after, before, describe, it } from 'node:test'
import { createApp, type AppOptions } from '../app.ts'
import { MockEvaluator } from '../evaluators/mockEvaluator.ts'
import { EvaluationError, type CodeEvaluator } from '../evaluators/types.ts'

const validBody = {
  statement: 'Escriba una función que calcule el promedio de una lista de números.',
  code: 'def calcular_promedio(lista):\n    return sum(lista) / len(lista)',
  language: 'Python',
}

const startServer = async (evaluator: CodeEvaluator, options?: AppOptions) => {
  const server: Server = await new Promise((resolve) => {
    const instance = createApp(evaluator, options).listen(0, () => resolve(instance))
  })
  const { port } = server.address() as AddressInfo
  return { server, url: `http://127.0.0.1:${port}` }
}

const post = (url: string, body: unknown) =>
  fetch(`${url}/api/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

describe('API /api/evaluate', () => {
  let server: Server
  let url: string

  before(async () => {
    ;({ server, url } = await startServer(new MockEvaluator({ delayMs: 0 })))
  })

  after(() => server.close())

  it('informa el modo activo en /api/health', async () => {
    const response = await fetch(`${url}/api/health`)
    assert.deepEqual(await response.json(), { status: 'ok', mode: 'mock' })
  })

  it('devuelve el análisis para una solicitud válida', async () => {
    const response = await post(url, validBody)
    const data = (await response.json()) as Record<string, any>

    assert.equal(response.status, 200)
    assert.equal(data.mode, 'mock')
    assert.equal(typeof data.isCompliant, 'boolean')
    assert.ok(Array.isArray(data.requirements))
  })

  it('rechaza con 400 un enunciado demasiado corto (RF-4)', async () => {
    const response = await post(url, { ...validBody, statement: 'corto' })
    const data = (await response.json()) as Record<string, any>

    assert.equal(response.status, 400)
    assert.ok(data.fields.statement)
  })

  it('rechaza con 400 un lenguaje no soportado', async () => {
    const response = await post(url, { ...validBody, language: 'Cobol' })
    assert.equal(response.status, 400)
  })

  it('rechaza con 400 un JSON mal formado', async () => {
    const response = await post(url, '{ no es json')
    assert.equal(response.status, 400)
  })
})

describe('API /api/evaluate con fallo del evaluador', () => {
  it('devuelve el mensaje y el código HTTP del EvaluationError', async () => {
    const failing: CodeEvaluator = {
      mode: 'ai',
      evaluate: async () => {
        throw new EvaluationError('Servicio no disponible', 503)
      },
    }
    const { server, url } = await startServer(failing)

    try {
      const response = await post(url, validBody)
      assert.equal(response.status, 503)
      assert.deepEqual(await response.json(), { error: 'Servicio no disponible' })
    } finally {
      server.close()
    }
  })
})

describe('API /api/evaluate con límite de solicitudes', () => {
  it('responde 429 al superar el máximo de evaluaciones por IP', async () => {
    const { server, url } = await startServer(new MockEvaluator({ delayMs: 0 }), { evaluationsPerWindow: 2 })

    try {
      assert.equal((await post(url, validBody)).status, 200)
      assert.equal((await post(url, validBody)).status, 200)
      const response = await post(url, validBody)
      assert.equal(response.status, 429)
      assert.match(((await response.json()) as { error: string }).error, /muchas evaluaciones/)
    } finally {
      server.close()
    }
  })
})

describe('API /api/health con un evaluador de IA', () => {
  it('informa el proveedor y el modelo', async () => {
    const aiEvaluator: CodeEvaluator = {
      mode: 'ai',
      provider: 'Groq',
      model: 'openai/gpt-oss-120b',
      evaluate: async () => {
        throw new Error('no se usa')
      },
    }
    const { server, url } = await startServer(aiEvaluator)

    try {
      const response = await fetch(`${url}/api/health`)
      assert.deepEqual(await response.json(), { status: 'ok', mode: 'ai', provider: 'Groq', model: 'openai/gpt-oss-120b' })
    } finally {
      server.close()
    }
  })
})
