import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { extractRequirements, MockEvaluator } from '../evaluators/mockEvaluator.ts'

const evaluator = new MockEvaluator({ delayMs: 0 })

const statement = 'Escriba una función que reciba una lista de números y calcule el promedio. Si la lista está vacía debe retornar cero.'

describe('MockEvaluator', () => {
  it('separa el enunciado en requisitos', () => {
    assert.deepEqual(extractRequirements(statement), [
      'Escriba una función que reciba una lista de números y calcule el promedio.',
      'Si la lista está vacía debe retornar cero.',
    ])
  })

  it('marca como cumple un código que cubre los requisitos', async () => {
    const code = `# Calcula el promedio de una lista de numeros
def calcular_promedio(lista_numeros):
    if len(lista_numeros) == 0:  # lista vacia
        return 0
    return sum(lista_numeros) / len(lista_numeros)`

    const result = await evaluator.evaluate({ statement, code, language: 'Python' })

    assert.equal(result.mode, 'mock')
    assert.equal(result.isCompliant, true)
    assert.equal(result.requirements.length, 2)
    assert.ok(result.requirements.every((requirement) => requirement.met))
  })

  it('marca como no cumple un código sin relación con el enunciado', async () => {
    const code = `def saludar(nombre):
    print("Hola " + nombre)`

    const result = await evaluator.evaluate({ statement, code, language: 'Python' })

    assert.equal(result.isCompliant, false)
    assert.ok(result.requirements.some((requirement) => !requirement.met))
  })

  it('marca como no cumple un código con TODO aunque mencione los requisitos', async () => {
    const code = `def calcular_promedio(lista_numeros):
    # TODO: manejar lista vacia
    return sum(lista_numeros) / len(lista_numeros)`

    const result = await evaluator.evaluate({ statement, code, language: 'Python' })

    assert.equal(result.isCompliant, false)
    assert.match(result.summary, /TODO/)
  })
})
