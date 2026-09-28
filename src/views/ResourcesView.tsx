import { BookOpen, ExternalLink, FileText, ListChecks } from 'lucide-react'

const statementTips = [
  'Indica qué datos recibe el programa (entradas) y en qué formato.',
  'Describe qué debe producir (salidas) con un ejemplo concreto.',
  'Menciona las restricciones: rangos de valores, casos especiales o errores que se deben manejar.',
  'Si el ejercicio pide usar algo específico (funciones, ciclos, recursión), escríbelo explícitamente.',
  'Copia el enunciado completo del docente; un resumen puede omitir requisitos.',
]

const usageSteps = [
  'Escribe o pega el enunciado del ejercicio.',
  'Elige el lenguaje y escribe tu código, o cárgalo desde un archivo.',
  'Presiona "Enviar para evaluación".',
  'Revisa los requisitos marcados como no cumplidos y la retroalimentación.',
  'Corrige tu solución y vuelve a enviarla. Tus evaluaciones quedan en el Historial.',
]

const documentation = [
  { language: 'Python', label: 'Documentación oficial de Python', url: 'https://docs.python.org/es/3/' },
  { language: 'JavaScript', label: 'MDN Web Docs: JavaScript', url: 'https://developer.mozilla.org/es/docs/Web/JavaScript' },
  { language: 'Java', label: 'Documentación de Java (Oracle)', url: 'https://docs.oracle.com/en/java/' },
  { language: 'C++', label: 'cppreference: C++', url: 'https://en.cppreference.com/w/cpp' },
  { language: 'C', label: 'cppreference: C', url: 'https://en.cppreference.com/w/c' },
]

export function ResourcesView() {
  return (
    <div className="view-stack">
      <section className="panel content-card view-card">
        <div className="card-header-row">
          <div className="card-title-wrap">
            <div className="panel-icon"><ListChecks size={18} /></div>
            <div>
              <h2>Cómo usar SIAC-IA</h2>
              <p>Los pasos para evaluar tu solución.</p>
            </div>
          </div>
        </div>
        <ol className="resource-list resource-steps">
          {usageSteps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </section>

      <section className="panel content-card view-card">
        <div className="card-header-row">
          <div className="card-title-wrap">
            <div className="panel-icon"><FileText size={18} /></div>
            <div>
              <h2>Cómo escribir un buen enunciado</h2>
              <p>Entre más claro sea el enunciado, más precisa será la evaluación.</p>
            </div>
          </div>
        </div>
        <ul className="resource-list">
          {statementTips.map((tip) => <li key={tip}>{tip}</li>)}
        </ul>
      </section>

      <section className="panel content-card view-card">
        <div className="card-header-row">
          <div className="card-title-wrap">
            <div className="panel-icon"><BookOpen size={18} /></div>
            <div>
              <h2>Documentación oficial</h2>
              <p>Referencias de los lenguajes soportados.</p>
            </div>
          </div>
        </div>
        <div className="doc-links">
          {documentation.map(({ language, label, url }) => (
            <a key={language} className="doc-link" href={url} target="_blank" rel="noopener noreferrer">
              <span className="language-tag">{language}</span>
              <span className="doc-link-label">{label}</span>
              <ExternalLink size={14} />
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
