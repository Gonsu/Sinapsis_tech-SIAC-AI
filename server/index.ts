import { createApp } from './app.ts'
import { ClaudeEvaluator, DEFAULT_MODEL } from './evaluators/claudeEvaluator.ts'
import { MockEvaluator } from './evaluators/mockEvaluator.ts'
import type { CodeEvaluator } from './evaluators/types.ts'

const port = Number(process.env.PORT ?? 3001)
const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL

// Sin clave de API se usa el evaluador de pruebas; con clave, Claude.
const evaluator: CodeEvaluator = apiKey ? new ClaudeEvaluator({ apiKey, model }) : new MockEvaluator()

createApp(evaluator).listen(port, () => {
  console.log(`[server] SIAC-IA API escuchando en http://localhost:${port}`)
  console.log(
    evaluator.mode === 'ai'
      ? `[server] Modo IA activo con el modelo ${model}.`
      : '[server] Modo de prueba: no hay ANTHROPIC_API_KEY, se usa el evaluador simulado.',
  )
})
