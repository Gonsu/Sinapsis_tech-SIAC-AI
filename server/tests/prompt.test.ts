import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildUserMessage } from '../evaluators/prompt.ts'

describe('buildUserMessage (RF-5)', () => {
  it('envuelve el enunciado y el código con los delimitadores esperados', () => {
    const message = buildUserMessage({ statement: 'ENUNCIADO', code: 'CODIGO', language: 'Python' })

    assert.match(message, /<enunciado>\nENUNCIADO\n<\/enunciado>/)
    assert.match(message, /<codigo>\nCODIGO\n<\/codigo>/)
    assert.match(message, /<lenguaje>Python<\/lenguaje>/)
  })
})
