import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import type { EvaluationInput, EvaluationResultData } from '../../shared/evaluation.ts'
import { EvaluationSchema, SYSTEM_PROMPT, buildUserMessage } from './prompt.ts'
import { EvaluationError, type CodeEvaluator } from './types.ts'

export const DEFAULT_MODEL = 'claude-opus-5'

const REQUEST_TIMEOUT_MS = 100_000

export class ClaudeEvaluator implements CodeEvaluator {
  readonly mode = 'ai' as const
  readonly provider = 'Claude'
  readonly model: string
  private readonly client: Anthropic

  constructor({ apiKey, model = DEFAULT_MODEL }: { apiKey?: string; model?: string } = {}) {
    // Sin reintentos internos y con tiempo acotado, para responder antes de que el navegador deje de esperar.
    this.client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 })
    this.model = model
  }

  async evaluate(input: EvaluationInput): Promise<EvaluationResultData> {
    let response
    try {
      response = await this.client.beta.messages.parse({
        model: this.model,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserMessage(input) }],
        output_config: { format: betaZodOutputFormat(EvaluationSchema) },
        // Si el modelo rechaza la solicitud por sus filtros de seguridad, la API la reintenta con otro modelo.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      })
    } catch (error) {
      throw toEvaluationError(error)
    }

    if (response.stop_reason === 'refusal') {
      throw new EvaluationError('El asistente no pudo analizar esta solución. Revisa el contenido e intenta nuevamente.')
    }
    if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
      throw new EvaluationError('La respuesta del asistente llegó incompleta. Intenta nuevamente.')
    }

    return { mode: this.mode, ...response.parsed_output }
  }
}

const toEvaluationError = (error: unknown) => {
  console.error('[ClaudeEvaluator]', error)

  if (error instanceof Anthropic.AuthenticationError) {
    return new EvaluationError('La clave de la API de Anthropic no es válida. Revisa ANTHROPIC_API_KEY en el archivo .env.', 500)
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new EvaluationError('Se alcanzó el límite de solicitudes al servicio de IA. Espera un momento e intenta de nuevo.', 429)
  }
  if (error instanceof Anthropic.BadRequestError) {
    return new EvaluationError('El servicio de IA rechazó la solicitud. Revisa la configuración del modelo.', 500)
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new EvaluationError('No se pudo conectar con el servicio de IA. Revisa tu conexión a internet.')
  }
  if (error instanceof Anthropic.APIError) {
    return new EvaluationError('El servicio de IA no está disponible en este momento. Intenta más tarde.')
  }
  return new EvaluationError('Ocurrió un error inesperado durante el análisis.', 500)
}
