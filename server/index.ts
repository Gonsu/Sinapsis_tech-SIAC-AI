import { createApp } from './app.ts'
import { createEvaluator } from './evaluators/providers.ts'

const port = Number(process.env.PORT ?? 3001)
const evaluator = createEvaluator(process.env)

createApp(evaluator).listen(port, () => {
  console.log(`[server] SIAC-IA API escuchando en http://localhost:${port}`)
  console.log(
    evaluator.mode === 'ai'
      ? `[server] Modo IA activo con ${evaluator.provider} (${evaluator.model}).`
      : '[server] Modo de prueba: no hay claves de IA configuradas, se usa el evaluador simulado.',
  )
})
