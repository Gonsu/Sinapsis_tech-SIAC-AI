import { z } from 'zod'
import type { EvaluationInput, EvaluationResultData } from '../../shared/evaluation.ts'
import { EvaluationSchema, SYSTEM_PROMPT, buildUserMessage } from './prompt.ts'
import { EvaluationError, type CodeEvaluator } from './types.ts'

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash'

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

// Esperas antes de reintentar cuando el modelo está saturado (HTTP 503).
const DEFAULT_RETRY_DELAYS_MS = [2_000, 5_000]

// Con los reintentos, el total queda por debajo del límite de espera del navegador (120 s).
const REQUEST_TIMEOUT_MS = 30_000

// Gemini recibe el mismo esquema que Claude, convertido a JSON Schema.
const RESPONSE_SCHEMA = z.toJSONSchema(EvaluationSchema)

interface GenerateContentResponse {
  candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[]
  promptFeedback?: { blockReason?: string }
}

export class GeminiEvaluator implements CodeEvaluator {
  readonly mode = 'ai' as const
  readonly provider = 'Gemini'
  readonly model: string
  private readonly apiKey: string
  private readonly retryDelaysMs: number[]

  constructor({
    apiKey,
    model = DEFAULT_GEMINI_MODEL,
    retryDelaysMs = DEFAULT_RETRY_DELAYS_MS,
  }: { apiKey: string; model?: string; retryDelaysMs?: number[] }) {
    this.apiKey = apiKey
    this.model = model
    this.retryDelaysMs = retryDelaysMs
  }

  async evaluate(input: EvaluationInput): Promise<EvaluationResultData> {
    let response = await this.request(input)
    for (const delay of this.retryDelaysMs) {
      if (response.status !== 503) break
      await new Promise((resolve) => setTimeout(resolve, delay))
      response = await this.request(input)
    }

    if (!response.ok) {
      throw await toEvaluationError(response)
    }

    const data = (await response.json()) as GenerateContentResponse
    const candidate = data.candidates?.[0]

    if (data.promptFeedback?.blockReason || candidate?.finishReason === 'SAFETY') {
      throw new EvaluationError('El asistente no pudo analizar esta solución. Revisa el contenido e intenta nuevamente.')
    }

    const text = candidate?.content?.parts?.filter((part) => !part.thought).map((part) => part.text ?? '').join('')
    if (candidate?.finishReason === 'MAX_TOKENS' || !text) {
      throw new EvaluationError('La respuesta del asistente llegó incompleta. Intenta nuevamente.')
    }

    let parsed
    try {
      parsed = EvaluationSchema.safeParse(JSON.parse(text))
    } catch {
      parsed = undefined
    }
    if (!parsed?.success) {
      console.error('[GeminiEvaluator] Respuesta con formato inválido:', text)
      throw new EvaluationError('La respuesta del asistente no tiene el formato esperado. Intenta nuevamente.')
    }

    return { mode: this.mode, ...parsed.data }
  }

  private async request(input: EvaluationInput): Promise<Response> {
    try {
      return await fetch(`${API_URL}/${this.model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: buildUserMessage(input) }] }],
          generationConfig: {
            maxOutputTokens: 16000,
            responseMimeType: 'application/json',
            responseJsonSchema: RESPONSE_SCHEMA,
          },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      console.error('[GeminiEvaluator]', error)
      throw new EvaluationError('No se pudo conectar con el servicio de IA. Revisa tu conexión a internet.')
    }
  }
}

const toEvaluationError = async (response: Response) => {
  const body = await response.text().catch(() => '')
  console.error(`[GeminiEvaluator] HTTP ${response.status}:`, body)

  if (response.status === 400 && body.includes('API_KEY_INVALID')) {
    return new EvaluationError('La clave de la API de Gemini no es válida. Revisa GEMINI_API_KEY en el archivo .env.', 500)
  }
  if (response.status === 401 || response.status === 403) {
    return new EvaluationError('La clave de la API de Gemini no es válida. Revisa GEMINI_API_KEY en el archivo .env.', 500)
  }
  if (response.status === 402) {
    return new EvaluationError('La cuenta de Gemini no tiene créditos disponibles. Recárgalos en AI Studio.', 500)
  }
  if (response.status === 429) {
    return new EvaluationError('Se alcanzó el límite de solicitudes al servicio de IA. Espera un momento e intenta de nuevo.', 429)
  }
  if (response.status === 503) {
    return new EvaluationError('El modelo de IA está saturado en este momento. Espera unos minutos e intenta de nuevo.', 503)
  }
  if (response.status === 400 || response.status === 404) {
    return new EvaluationError('El servicio de IA rechazó la solicitud. Revisa la configuración del modelo.', 500)
  }
  return new EvaluationError('El servicio de IA no está disponible en este momento. Intenta más tarde.')
}
