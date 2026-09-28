import express, { type NextFunction, type Request, type Response } from 'express'
import { rateLimit } from 'express-rate-limit'
import { validateEvaluationInput } from '../shared/evaluation.ts'
import { EvaluationError, type CodeEvaluator } from './evaluators/types.ts'

export interface AppOptions {
  /** Máximo de evaluaciones por IP en cada ventana, para no agotar la cuota del servicio de IA. */
  evaluationsPerWindow?: number
  windowMs?: number
}

export const createApp = (evaluator: CodeEvaluator, { evaluationsPerWindow = 10, windowMs = 60_000 }: AppOptions = {}) => {
  const app = express()
  app.use(express.json({ limit: '100kb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', mode: evaluator.mode, provider: evaluator.provider, model: evaluator.model })
  })

  const evaluationLimiter = rateLimit({
    windowMs,
    limit: evaluationsPerWindow,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: 'Has enviado muchas evaluaciones seguidas. Espera un minuto e intenta de nuevo.' })
    },
  })

  // RF-3 / RF-5: recibe enunciado y código, y devuelve el análisis.
  app.post('/api/evaluate', evaluationLimiter, async (req, res, next) => {
    const { statement, code, language } = req.body ?? {}

    // RF-4 también en el servidor: no se confía solo en la validación del navegador.
    const errors = validateEvaluationInput(statement, code, language)
    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: 'La solicitud no tiene la información mínima requerida.', fields: errors })
      return
    }

    try {
      res.json(await evaluator.evaluate({ statement, code, language }))
    } catch (error) {
      next(error)
    }
  })

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada.' })
  })

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof EvaluationError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    if (error instanceof SyntaxError || (error as { type?: string }).type === 'entity.too.large') {
      res.status(400).json({ error: 'El cuerpo de la solicitud no es válido o es demasiado grande.' })
      return
    }
    console.error('[server]', error)
    res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' })
  })

  return app
}
