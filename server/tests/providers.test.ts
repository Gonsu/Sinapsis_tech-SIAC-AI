import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createEvaluator } from '../evaluators/providers.ts'

describe('createEvaluator', () => {
  it('usa el evaluador de pruebas si no hay claves', () => {
    const evaluator = createEvaluator({ GROQ_API_KEY: '  ' })
    assert.equal(evaluator.mode, 'mock')
  })

  it('usa el primer proveedor con clave en el orden Groq, Gemini, Claude', () => {
    assert.equal(createEvaluator({ GEMINI_API_KEY: 'g', ANTHROPIC_API_KEY: 'a' }).provider, 'Gemini')
    assert.equal(createEvaluator({ GROQ_API_KEY: 'q', GEMINI_API_KEY: 'g' }).provider, 'Groq')
    assert.equal(createEvaluator({ ANTHROPIC_API_KEY: 'a' }).provider, 'Claude')
  })

  it('respeta AI_PROVIDER aunque haya otras claves', () => {
    const evaluator = createEvaluator({ AI_PROVIDER: 'Gemini', GROQ_API_KEY: 'q', GEMINI_API_KEY: 'g' })
    assert.equal(evaluator.provider, 'Gemini')
  })

  it('usa el modelo configurado', () => {
    assert.equal(createEvaluator({ GROQ_API_KEY: 'q', GROQ_MODEL: 'qwen/qwen3.8-27b' }).model, 'qwen/qwen3.8-27b')
  })

  it('falla si AI_PROVIDER no existe', () => {
    assert.throws(() => createEvaluator({ AI_PROVIDER: 'otro' }), /no es válido/)
  })

  it('falla si AI_PROVIDER no tiene su clave', () => {
    assert.throws(() => createEvaluator({ AI_PROVIDER: 'claude', GROQ_API_KEY: 'q' }), /requiere configurar su clave/)
  })
})
