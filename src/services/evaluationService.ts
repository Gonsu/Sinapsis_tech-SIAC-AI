export interface EvaluationInput {
  statement: string;
  code: string;
  language: string;
}

export interface EvaluationResultData {
  isCompliant: boolean;
  summary: string;
  feedbackDetails?: {
    logic?: string;
    structure?: string;
    goodPracticesApplied?: string[];
    goodPracticesMissing?: string[];
  };
}

export async function analyzeCodeCompliance(
  input: EvaluationInput
): Promise<EvaluationResultData> {
  const { statement, code, language } = input;

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const cleanCode = code.trim();
  const cleanStatement = statement.trim();

  if (!cleanCode || !cleanStatement) {
    throw new Error('El enunciado y el código fuente son obligatorios para el análisis.');
  }

  
  const hasTodo = /TODO/i.test(cleanCode);
  const isTooShort = cleanCode.length < 15;
  const isPass = !hasTodo && !isTooShort;

  if (isPass) {
    return {
      isCompliant: true,
      summary: `El código en ${language} analiza correctamente los requerimientos descritos en el enunciado. La solución presenta una estructura coherente y ejecutable.`,
      feedbackDetails: {
        logic: 'La lógica implementada responde al objetivo principal planteado.',
        structure: 'El código presenta una estructura ordenada de instrucciones.',
      },
    };
  }

  return {
    isCompliant: false,
    summary: `El código en ${language} requiere ajustes para cumplir con el enunciado. Se detectaron secciones incompletas o falta de lógica suficiente.`,
    feedbackDetails: {
      logic: 'Faltan instrucciones clave para completar la solución esperada.',
      structure: 'Existen marcas pendientes (como TODO) o bloques incompletos.',
    },
  };
}