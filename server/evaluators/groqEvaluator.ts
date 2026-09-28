import Groq from 'groq-sdk'
import { z } from 'zod'
import type { EvaluationInput, EvaluationResultData } from '../../shared/evaluation.ts'
import { EvaluationSchema, SYSTEM_PROMPT, buildUserMessage } from './prompt.ts'
import { EvaluationError, type CodeEvaluator } from './types.ts'

export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b'

// Groq valida el JSON después de generarlo; si no respeta el esquema, se reintenta.
const MAX_ATTEMPTS = 3

// Con los reintentos, el total queda por debajo del límite de espera del navegador (120 s).
const REQUEST_TIMEOUT_MS = 30_000

const RESPONSE_SCHEMA = z.toJSONSchema(EvaluationSchema) as Record<string, unknown>

export class GroqEvaluator implements CodeEvaluator {
  readonly mode = 'ai' as const
  readonly provider = 'Groq'
  readonly model: string
  private readonly client: Groq

  constructor({ apiKey, model = DEFAULT_GROQ_MODEL }: { apiKey: string; model?: string }) {
    // Los reintentos los controla este evaluador, no el SDK.
    this.client = new Groq({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 })
    this.model = model
  }

  async evaluate(input: EvaluationInput): Promise<EvaluationResultData> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.request(input)
      } catch (error) {
        if (attempt < MAX_ATTEMPTS && isInvalidOutput(error)) continue
        throw toEvaluationError(error)
      }
    }
  }

  private async request(input: EvaluationInput): Promise<EvaluationResultData> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_completion_tokens: 16000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(input) },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'evaluacion', strict: true, schema: RESPONSE_SCHEMA },
      },
    })

    const choice = response.choices[0]
    if (choice?.finish_reason === 'length' || !choice?.message.content) {
      throw new EvaluationError('La respuesta del asistente llegó incompleta. Intenta nuevamente.')
    }

    const parsed = EvaluationSchema.safeParse(JSON.parse(choice.message.content))
    if (!parsed.success) {
      throw new InvalidOutputError()
    }
    return { mode: this.mode, ...parsed.data }
  }
}

class InvalidOutputError extends Error {}

const isInvalidOutput = (error: unknown) =>
  error instanceof InvalidOutputError ||
  error instanceof SyntaxError ||
  (error instanceof Groq.BadRequestError && JSON.stringify(error.error).includes('json_validate_failed'))

const toEvaluationError = (error: unknown) => {
  if (error instanceof EvaluationError) return error
  console.error('[GroqEvaluator]', error)

  if (isInvalidOutput(error)) {
    return new EvaluationError('La respuesta del asistente no tiene el formato esperado. Intenta nuevamente.')
  }
  if (error instanceof Groq.AuthenticationError) {
    return new EvaluationError('La clave de la API de Groq no es válida. Revisa GROQ_API_KEY en el archivo .env.', 500)
  }
  if (error instanceof Groq.RateLimitError) {
    return new EvaluationError('Se alcanzó el límite de solicitudes al servicio de IA. Espera un momento e intenta de nuevo.', 429)
  }
  if (error instanceof Groq.BadRequestError || error instanceof Groq.NotFoundError) {
    return new EvaluationError('El servicio de IA rechazó la solicitud. Revisa la configuración del modelo.', 500)
  }
  if (error instanceof Groq.APIConnectionError) {
    return new EvaluationError('No se pudo conectar con el servicio de IA. Revisa tu conexión a internet.')
  }
  if (error instanceof Groq.APIError) {
    return new EvaluationError('El servicio de IA no está disponible en este momento. Intenta más tarde.')
  }
  return new EvaluationError('Ocurrió un error inesperado durante el análisis.', 500)
}
