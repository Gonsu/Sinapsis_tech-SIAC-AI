import type { EvaluationInput, EvaluationResultData, RequirementVerdict } from '../../shared/evaluation.ts'
import type { CodeEvaluator } from './types.ts'

// Evaluador de pruebas: permite usar la app sin clave de API.
// Es una heurística por palabras clave, NO un análisis real. Lo reemplaza un evaluador con IA
// cuando se configura una clave de API (ver server/evaluators/providers.ts).

const MAX_REQUIREMENTS = 6

const STOPWORDS = new Set([
  'para', 'como', 'cada', 'debe', 'deben', 'desde', 'donde', 'entre', 'este', 'esta', 'estos', 'estas',
  'hacer', 'hasta', 'luego', 'mismo', 'mientras', 'otro', 'otra', 'pero', 'programa', 'sobre', 'solo',
  'todo', 'todos', 'tambien', 'tiene', 'tienen', 'usuario', 'valor', 'valores', 'cual', 'cuales',
  'que', 'una', 'unos', 'unas', 'dado', 'dada', 'dados', 'dadas', 'segun', 'ademas', 'forma', 'manera',
  'realizar', 'escribir', 'escriba', 'implementar', 'implemente', 'crear', 'cree', 'funcion', 'codigo',
  'with', 'that', 'this', 'from', 'should', 'must', 'write', 'return', 'program',
])

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Divide camelCase / snake_case y devuelve las palabras normalizadas del texto. */
const tokenize = (text: string) =>
  normalize(text.replace(/([a-z])([A-Z])/g, '$1 $2'))
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

const keywordsOf = (text: string) =>
  [...new Set(tokenize(text).filter((word) => word.length >= 4 && !STOPWORDS.has(word) && !/^\d+$/.test(word)))]

/** Coincidencia por raíz (primeras 5 letras) para tolerar plurales y conjugaciones: "promedio" ~ "promediar". */
const matches = (keyword: string, codeWords: Set<string>) => {
  const stem = keyword.slice(0, 5)
  for (const word of codeWords) {
    if (word === keyword || (stem.length >= 4 && word.startsWith(stem))) return true
  }
  return false
}

export const extractRequirements = (statement: string) => {
  const fragments = statement
    .split(/\r?\n|(?<=[.;:!?])\s+/)
    .map((fragment) => fragment.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter((fragment) => fragment.length >= 12 && keywordsOf(fragment).length > 0)

  return (fragments.length > 0 ? fragments : [statement.trim()]).slice(0, MAX_REQUIREMENTS)
}

const detectPractices = (code: string) => {
  const applied: string[] = []
  const missing: string[] = []

  const hasFunctions = /\b(def|function|fn)\s+\w+\s*\(|=>|\b\w+\s+\w+\s*\([^)]*\)\s*\{/.test(code)
  const hasComments = /(^|\s)(#|\/\/)|\/\*/.test(code)
  const identifiers = code.match(/\b[A-Za-z_]\w*\b/g) ?? []
  const shortNames = identifiers.filter((name) => name.length === 1 && !['i', 'j', 'k'].includes(name)).length
  const descriptiveNames = identifiers.length > 0 && shortNames / identifiers.length < 0.15

  ;(hasFunctions ? applied : missing).push('Organización del código en funciones')
  ;(hasComments ? applied : missing).push('Comentarios que explican la solución')
  ;(descriptiveNames ? applied : missing).push('Nombres de variables descriptivos')

  return { applied, missing }
}

export class MockEvaluator implements CodeEvaluator {
  readonly mode = 'mock' as const
  private readonly delayMs: number

  constructor({ delayMs = 800 }: { delayMs?: number } = {}) {
    this.delayMs = delayMs
  }

  async evaluate({ statement, code, language }: EvaluationInput): Promise<EvaluationResultData> {
    if (this.delayMs > 0) await new Promise((resolve) => setTimeout(resolve, this.delayMs))

    const codeWords = new Set(tokenize(code))
    const hasPendingMarks = /\b(TODO|FIXME)\b/i.test(code)

    const requirements: RequirementVerdict[] = extractRequirements(statement).map((description) => {
      const keywords = keywordsOf(description)
      const found = keywords.filter((keyword) => matches(keyword, codeWords))
      const met = found.length > 0

      return {
        description,
        met,
        evidence: met
          ? `El código hace referencia a: ${found.join(', ')}.`
          : `No se encontraron en el código términos relacionados (${keywords.slice(0, 4).join(', ')}).`,
      }
    })

    const unmet = requirements.filter((requirement) => !requirement.met).length
    const isCompliant = !hasPendingMarks && unmet === 0
    const practices = detectPractices(code)

    let summary: string
    if (isCompliant) {
      summary = `El código en ${language} parece cubrir los ${requirements.length} requisito(s) identificados en el enunciado.`
    } else if (hasPendingMarks) {
      summary = `El código en ${language} contiene marcas pendientes (TODO/FIXME), por lo que la solución aún está incompleta.`
    } else {
      summary = `El código en ${language} no evidencia ${unmet} de ${requirements.length} requisito(s) identificados en el enunciado.`
    }

    return {
      mode: this.mode,
      isCompliant,
      summary: `${summary} (Modo de prueba: análisis por palabras clave, sin IA.)`,
      requirements,
      feedbackDetails: {
        logic: isCompliant
          ? 'Los términos principales del enunciado aparecen en la solución.'
          : 'Revisa los requisitos marcados como no cumplidos y verifica que tu código los resuelva.',
        structure: hasPendingMarks
          ? 'Existen marcas pendientes (TODO/FIXME) que indican partes sin terminar.'
          : 'No se detectaron marcas de trabajo pendiente.',
        goodPracticesApplied: practices.applied,
        goodPracticesMissing: practices.missing,
      },
    }
  }
}
