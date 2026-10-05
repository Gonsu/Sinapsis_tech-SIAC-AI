import { ClaudeEvaluator, DEFAULT_MODEL } from './claudeEvaluator.ts'
import { DEFAULT_GEMINI_MODEL, GeminiEvaluator } from './geminiEvaluator.ts'
import { DEFAULT_GROQ_MODEL, GroqEvaluator } from './groqEvaluator.ts'
import { MockEvaluator } from './mockEvaluator.ts'
import type { CodeEvaluator } from './types.ts'

type Env = Record<string, string | undefined>

const read = (env: Env, name: string) => env[name]?.trim() || undefined

// Proveedores de IA en orden de preferencia. Cada uno se activa si tiene su clave configurada.
const providers = {
  groq: (env: Env) => {
    const apiKey = read(env, 'GROQ_API_KEY')
    return apiKey && new GroqEvaluator({ apiKey, model: read(env, 'GROQ_MODEL') ?? DEFAULT_GROQ_MODEL })
  },
  gemini: (env: Env) => {
    const apiKey = read(env, 'GEMINI_API_KEY')
    return apiKey && new GeminiEvaluator({ apiKey, model: read(env, 'GEMINI_MODEL') ?? DEFAULT_GEMINI_MODEL })
  },
  claude: (env: Env) => {
    const apiKey = read(env, 'ANTHROPIC_API_KEY')
    return apiKey && new ClaudeEvaluator({ apiKey, model: read(env, 'ANTHROPIC_MODEL') ?? DEFAULT_MODEL })
  },
}

const PROVIDER_NAMES = Object.keys(providers)

/**
 * AI_PROVIDER fuerza un proveedor; si no se indica, se usa el primero con clave.
 * Sin claves se usa el evaluador de pruebas.
 */
export const createEvaluator = (env: Env): CodeEvaluator => {
  const requested = read(env, 'AI_PROVIDER')?.toLowerCase()
  if (requested) {
    if (!Object.hasOwn(providers, requested as any)) {
      throw new Error(`AI_PROVIDER="${requested}" no es válido. Usa: ${PROVIDER_NAMES.join(', ')}.`)
    }
    const evaluator = providers[requested as keyof typeof providers](env)
    if (!evaluator) throw new Error(`AI_PROVIDER="${requested}" requiere configurar su clave de API en el archivo .env.`)
    return evaluator
  }

  for (const create of Object.values(providers)) {
    const evaluator = create(env)
    if (evaluator) return evaluator
  }
  return new MockEvaluator()
}
