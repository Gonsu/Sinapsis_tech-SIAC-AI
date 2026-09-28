// Tipos y reglas compartidas entre el frontend (src/) y el servidor Express (server/).

export const SUPPORTED_LANGUAGES = ['Python', 'JavaScript', 'Java', 'C++', 'C'] as const

export const MIN_STATEMENT_LENGTH = 20
export const MIN_CODE_LENGTH = 20
export const MAX_STATEMENT_LENGTH = 2000
export const MAX_CODE_LENGTH = 20000

export interface EvaluationInput {
  statement: string
  code: string
  language: string
}

export interface RequirementVerdict {
  description: string
  met: boolean
  evidence: string
}

export interface EvaluationResultData {
  /** 'ai' cuando respondió Claude; 'mock' cuando respondió el evaluador de pruebas. */
  mode: 'ai' | 'mock'
  isCompliant: boolean
  summary: string
  requirements: RequirementVerdict[]
  feedbackDetails?: {
    logic?: string
    structure?: string
    goodPracticesApplied?: string[]
    goodPracticesMissing?: string[]
  }
}

export type ValidationErrors = { statement?: string; code?: string; language?: string }

// RF-4: información mínima requerida antes de iniciar la evaluación.
export const validateEvaluationInput = (statement: unknown, code: unknown, language?: unknown): ValidationErrors => {
  const errors: ValidationErrors = {}

  if (typeof statement !== 'string' || !statement) {
    errors.statement = 'El enunciado es obligatorio.'
  } else if (statement.trim().length === 0) {
    errors.statement = 'El enunciado no puede estar vacío o contener solo espacios.'
  } else if (statement.trim().length < MIN_STATEMENT_LENGTH) {
    errors.statement = 'El enunciado debe contener información suficiente para iniciar la evaluación.'
  } else if (statement.length > MAX_STATEMENT_LENGTH) {
    errors.statement = `El enunciado no puede superar los ${MAX_STATEMENT_LENGTH} caracteres.`
  }

  if (typeof code !== 'string' || !code) {
    errors.code = 'El código fuente es obligatorio.'
  } else if (code.trim().length === 0) {
    errors.code = 'El código fuente no puede estar vacío o contener solo espacios.'
  } else if (code.trim().length < MIN_CODE_LENGTH) {
    errors.code = 'El código fuente debe contener contenido mínimo para poder continuar.'
  } else if (code.length > MAX_CODE_LENGTH) {
    errors.code = `El código fuente no puede superar los ${MAX_CODE_LENGTH} caracteres.`
  }

  if (language !== undefined && !SUPPORTED_LANGUAGES.includes(language as (typeof SUPPORTED_LANGUAGES)[number])) {
    errors.language = 'El lenguaje seleccionado no está soportado.'
  }

  return errors
}
