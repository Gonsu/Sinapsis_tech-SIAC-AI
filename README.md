# SIAC-IA

Herramienta académica de la UFPS para que el estudiante revise si su solución de programación cumple con el enunciado del ejercicio.

## Estructura

```
src/        Frontend (React + Vite + Tailwind)
server/     API (Express) que realiza el análisis
  evaluators/mockEvaluator.ts    Evaluador de pruebas (sin IA, por palabras clave)
  evaluators/claudeEvaluator.ts  Evaluador con IA (Claude, de Anthropic)
  tests/                         Pruebas de la API y del evaluador
shared/     Tipos y validaciones usados por el frontend y el servidor
```

El frontend envía el enunciado y el código a `POST /api/evaluate`. En desarrollo, Vite redirige `/api` al servidor Express (puerto 3001).

## Requisitos

- Node.js 22.18 o superior (ejecuta el servidor TypeScript sin compilar)

## Uso

```bash
npm install
npm run dev      # frontend en http://localhost:5173 y API en http://localhost:3001
npm test         # pruebas del servidor
npm run lint
npm run build
```

## Modo de prueba y modo IA

Sin configuración, el servidor usa el **evaluador de pruebas**: un análisis simple por palabras clave para desarrollar y probar la app sin costo. El resultado aparece marcado como "Modo de prueba · sin IA".

Para activar la IA:

1. Copia `.env.example` como `.env`.
2. Pega tu clave de API de Anthropic en `ANTHROPIC_API_KEY`.
3. Reinicia `npm run dev`. La consola del servidor mostrará `Modo IA activo`.

El archivo `.env` está en `.gitignore`: la clave nunca debe subirse al repositorio ni usarse en el frontend.

## Requerimientos funcionales (iteración 1)

| RF | Dónde |
|---|---|
| RF-1 Ingresar el enunciado | `src/App.tsx` (sección 1, con borrador guardado) |
| RF-2 Ingresar o cargar el código | `src/App.tsx` (`CodeEditor`, carga de archivo por lenguaje) |
| RF-3 Enviar para evaluación | `src/services/evaluationService.ts` → `POST /api/evaluate` |
| RF-4 Validar información mínima | `shared/evaluation.ts` (se aplica en el navegador y en el servidor) |
| RF-5 Analizar el código frente al enunciado | `server/evaluators/` |
| RF-6 Informar si cumple o no | `src/App.tsx` (`EvaluationResult`, con detalle por requisito) |
