import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { MAX_STATEMENT_LENGTH, validateEvaluationInput } from '../../shared/evaluation.ts'

const valid = {
  statement: 'Escriba una función que calcule el promedio de una lista de números.',
  code: 'def calcular_promedio(lista):\n    return sum(lista) / len(lista)',
  language: 'Python',
}

describe('validateEvaluationInput (RF-4)', () => {
  it('no reporta errores con información válida', () => {
    assert.deepEqual(validateEvaluationInput(valid.statement, valid.code, valid.language), {})
  })

  it('rechaza un enunciado vacío o demasiado corto', () => {
    assert.ok(validateEvaluationInput('', valid.code, valid.language).statement)
    assert.ok(validateEvaluationInput('   ', valid.code, valid.language).statement)
    assert.ok(validateEvaluationInput('corto', valid.code, valid.language).statement)
  })

  it('rechaza un enunciado que supera el máximo permitido', () => {
    const statement = 'a'.repeat(MAX_STATEMENT_LENGTH + 1)
    assert.ok(validateEvaluationInput(statement, valid.code, valid.language).statement)
  })

  it('rechaza un código vacío o demasiado corto', () => {
    assert.ok(validateEvaluationInput(valid.statement, '', valid.language).code)
    assert.ok(validateEvaluationInput(valid.statement, '   ', valid.language).code)
  })

  it('rechaza un lenguaje no soportado o ausente', () => {
    assert.ok(validateEvaluationInput(valid.statement, valid.code, 'Cobol').language)
    assert.ok(validateEvaluationInput(valid.statement, valid.code, undefined).language)
  })
})
