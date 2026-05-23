import type { ConditionalDisplayGroup, FormField, ResponseInForm, Section } from "./formTypeStructure";

// Types plus stricts pour améliorer la robustesse
type ConditionalOperator = 
  | "==" 
  | "!=" 
  | ">" 
  | "<" 
  | "IN" 
  | "NOT IN" 
  | "CONTAINS" 
  | "NOT CONTAINS";

// type ComputationType = "SOMME" | "MULTIPLICATION";

// Fonction utilitaire pour normaliser les entrées en tableaux
function normalizeToArray<T>(input?: T | T[]): T[] {
  if (input === undefined) return [];
  return Array.isArray(input) ? input : [input];
}

export function shouldDisplayFormField(field: FormField, allResponseInForms: Record<string, ResponseInForm>): boolean {
  // console.log(`🔍 [shouldDisplayFormField] Evaluating field:`, field.conditionalDisplay);
  const result = evaluateConditionalDisplay(allResponseInForms, field.conditionalDisplay);
  // console.log(`✅ [shouldDisplayFormField] Result: ${result}`);
  return result;
}

// export function shouldDisplaySection(section: Section, allResponseInForms: Record<string, ResponseInForm>): boolean {
//   console.log(`🔍 [shouldDisplaySection] Evaluating section:`, section.conditionalDisplay);
//   const result = evaluateConditionalDisplay(allResponseInForms, section.conditionalDisplay);
//   console.log(`✅ [shouldDisplaySection] Result: ${result}`);
//   return result;
// }

export function shouldDisplaySection(section: Section, allResponseInForms: Record<string, ResponseInForm>): boolean {
  // console.log(`🔍 [shouldDisplaySection] Section ID: ${section.title}`);
  // console.log(`🧾  conditionalDisplay:`, JSON.stringify(section.conditionalDisplay, null, 2));

  const result = evaluateConditionalDisplay(allResponseInForms, section.conditionalDisplay);

  // console.log(`✅ [shouldDisplaySection] Result for section "${section.title}": ${result}`);
  return result;
}



function evaluateConditionalDisplay(
  allResponseInForms: Record<string, ResponseInForm>,
  display?: ConditionalDisplayGroup
): boolean {
  if (!display) {
    return true;
  }

  return evaluateConditionalDisplayGroup(display, allResponseInForms);
}

function evaluateConditionalDisplayGroup(
  group: ConditionalDisplayGroup,
  allResponseInForms: Record<string, ResponseInForm>
): boolean {
  // console.log(`🔧 [evaluateConditionalDisplayGroup] Starting group evaluation`);
  // console.log(`🔧 [evaluateConditionalDisplayGroup] Group logic: ${group.logic}`);
  // console.log(`🔧 [evaluateConditionalDisplayGroup] Rules count: ${group.rules.length}`);
  
  const rules = normalizeToArray(group.rules);
  const evaluations = rules.map((rule) => {
    // console.log(`\n🔧 [Rule ${ruleIndex + 1}] Starting rule evaluation:`, rule);
    
    const { fieldName, formFieldId, value, operator, numeric_compare_to, typeComputation } = rule;
    
    // Simplification de la récupération des clés de champs
    const fieldKeys: string[] = normalizeToArray(fieldName).length > 0 
      ? normalizeToArray(fieldName) 
      : normalizeToArray(formFieldId);

    // console.log(`🔧 [Rule ${ruleIndex + 1}] Final field keys:`, fieldKeys);

    // Si aucune clé n'est trouvée, la règle échoue
    if (fieldKeys.length === 0) {
      // console.log(`❌ [Rule ${ruleIndex + 1}] No field keys found, rule fails`);
      return false;
    }

    // Récupération des valeurs depuis les réponses
    const values: ResponseInForm['responseValue'][] = fieldKeys
      .map(k => {
        const response = allResponseInForms[k];
        const value = response?.responseValue;
        // console.log(`🔧 [Rule ${ruleIndex + 1}] Field "${k}" -> response:`, response, `-> value:`, value);
        return value;
      })
      .filter(v => {
        const isDefined = v !== undefined;
        // console.log(`🔧 [Rule ${ruleIndex + 1}] Value ${v} is defined: ${isDefined}`);
        return isDefined;
      });

    // console.log(`🔧 [Rule ${ruleIndex + 1}] Collected values:`, values);

    // Si aucune valeur n'est trouvée, la règle échoue
    if (values.length === 0) {
      // console.log(`❌ [Rule ${ruleIndex + 1}] No values found, rule fails`);
      return false;
    }

    let finalValue: ResponseInForm['responseValue'] = values[0] || null;
    // console.log(`🔧 [Rule ${ruleIndex + 1}] Initial final value:`, finalValue);

    // Application des règles de calcul si plusieurs valeurs
    if (values.length > 1 && typeComputation) {
      // console.log(`🔧 [Rule ${ruleIndex + 1}] Multiple values detected, applying computation: ${typeComputation}`);
      
      if (typeComputation === "SOMME") {
        const numericValues = values.map(v => {
          const num = convertToNumber(v);
          // console.log(`🔧 [Rule ${ruleIndex + 1}] Converting ${v} to number: ${num}`);
          return num;
        });
        finalValue = numericValues.reduce((acc, curr) => {
          // console.log(`🔧 [Rule ${ruleIndex + 1}] Sum: ${acc} + ${curr} = ${acc + curr}`);
          return acc + curr;
        }, 0);
      } else if (typeComputation === "MULTIPLICATION") {
        const numericValues = values.map(v => {
          const num = convertToNumber(v);
          // console.log(`🔧 [Rule ${ruleIndex + 1}] Converting ${v} to number: ${num}`);
          return num;
        });
        finalValue = numericValues.reduce((acc, curr) => {
          // console.log(`🔧 [Rule ${ruleIndex + 1}] Multiply: ${acc} * ${curr} = ${acc * curr}`);
          return acc * curr;
        }, 1);
      }
      
      // console.log(`🔧 [Rule ${ruleIndex + 1}] Final computed value:`, finalValue);
    }

    // Évaluation selon l'opérateur
    // console.log(`🔧 [Rule ${ruleIndex + 1}] Evaluating condition:`);
    // console.log(`  - finalValue:`, finalValue);
    // console.log(`  - operator:`, operator);
    // console.log(`  - value:`, value);
    // console.log(`  - numeric_compare_to:`, numeric_compare_to);
    
    const result = evaluateCondition(finalValue, operator as ConditionalOperator, value, numeric_compare_to);
    // console.log(`🔧 [Rule ${ruleIndex + 1}] Condition result: ${result}`);
    
    return result;
  });

  // console.log(`\n🔧 [evaluateConditionalDisplayGroup] All rule results:`, evaluations);
  
  const finalResult = group.logic === "AND"
    ? evaluations.every(Boolean)
    : evaluations.some(Boolean);
    
  // console.log(`🔧 [evaluateConditionalDisplayGroup] Group logic "${group.logic}" final result: ${finalResult}`);
  // console.log(`🧪 [evaluateConditionalDisplayGroup] Final result for group "${group.logic}":`, finalResult);

  return finalResult;
}

/**
 * Convertit une valeur en nombre pour les calculs
 */
function convertToNumber(value: ResponseInForm['responseValue'] | string | number | boolean | string[] | number[] | undefined): number {
  // console.log(`🔢 [convertToNumber] Converting:`, value, `(type: ${typeof value})`);
  
  if (typeof value === "number") {
    // console.log(`🔢 [convertToNumber] Already a number: ${value}`);
    return value;
  }
  
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    const result = isNaN(parsed) ? 0 : parsed;
    // console.log(`🔢 [convertToNumber] String "${value}" -> parsed: ${parsed} -> result: ${result}`);
    return result;
  }
  
  if (typeof value === "boolean") {
    const result = value ? 1 : 0;
    // console.log(`🔢 [convertToNumber] Boolean ${value} -> ${result}`);
    return result;
  }
  
  if (Array.isArray(value)) {
    // console.log(`🔢 [convertToNumber] Array length: ${value.length}`);
    return value.length;
  }
  
  // console.log(`🔢 [convertToNumber] Default case, returning 0`);
  return 0;
}

/**
 * Évalue une condition selon l'opérateur
 */
function evaluateCondition(
  finalValue: ResponseInForm['responseValue'],
  operator?: ConditionalOperator,
  value?: string | number | boolean | string[] | number[],
  numeric_compare_to?: number
): boolean {
  // console.log(`⚖️ [evaluateCondition] Starting condition evaluation`);
  // console.log(`⚖️ [evaluateCondition] finalValue:`, finalValue, `(type: ${typeof finalValue})`);
  // console.log(`⚖️ [evaluateCondition] operator:`, operator);
  // console.log(`⚖️ [evaluateCondition] value:`, value, `(type: ${typeof value})`);
  // console.log(`⚖️ [evaluateCondition] numeric_compare_to:`, numeric_compare_to);
  
  if (!operator) {
    // console.log(`⚖️ [evaluateCondition] No operator, returning true`);
    return true;
  }

  switch (operator) {
    case "==": {
      const finalStr = String(finalValue);
      const valueStr = String(value);
      const result = finalStr === valueStr;
      // console.log(`⚖️ [evaluateCondition] == comparison: "${finalStr}" === "${valueStr}" -> ${result}`);
      return result;
    }
      
    case "!=": {
      const finalStr = String(finalValue);
      const valueStr = String(value);
      const result = finalStr !== valueStr;
      // console.log(`⚖️ [evaluateCondition] != comparison: "${finalStr}" !== "${valueStr}" -> ${result}`);
      return result;
    }
      
    case ">": {
      const numValue = convertToNumber(finalValue);
      const compareValue = numeric_compare_to ?? convertToNumber(value);
      const result = numValue > compareValue;
      // console.log(`⚖️ [evaluateCondition] > comparison: ${numValue} > ${compareValue} -> ${result}`);
      return result;
    }
      
    case "<": {
      const numValueLess = convertToNumber(finalValue);
      const compareValueLess = numeric_compare_to ?? convertToNumber(value);
      const result = numValueLess < compareValueLess;
      // console.log(`⚖️ [evaluateCondition] < comparison: ${numValueLess} < ${compareValueLess} -> ${result}`);
      return result;
    }
      
    case "IN": {
      if (!Array.isArray(value)) {
        // console.log(`⚖️ [evaluateCondition] IN: value is not an array, returning false`);
        return false;
      }
      const result = value.some(v => String(v) === String(finalValue));
      // console.log(`⚖️ [evaluateCondition] IN: final result -> ${result}`);
      return result;
    }
      
    case "NOT IN": {
      if (!Array.isArray(value)) {
        // console.log(`⚖️ [evaluateCondition] NOT IN: value is not an array, returning false`);
        return false;
      }
      const result = !value.some(v => String(v) === String(finalValue));
      // console.log(`⚖️ [evaluateCondition] NOT IN: final result -> ${result}`);
      return result;
    }
      
    case "CONTAINS": {
      if (!Array.isArray(finalValue)) {
        // console.log(`⚖️ [evaluateCondition] CONTAINS: finalValue is not an array, returning false`);
        return false;
      }
      const result = finalValue.some(v => String(v) === String(value));
      // console.log(`⚖️ [evaluateCondition] CONTAINS: final result -> ${result}`);
      return result;
    }
      
    case "NOT CONTAINS": {
      if (!Array.isArray(finalValue)) {
        // console.log(`⚖️ [evaluateCondition] NOT CONTAINS: finalValue is not an array, returning false`);
        return false;
      }
      const result = !finalValue.some(v => String(v) === String(value));
      // console.log(`⚖️ [evaluateCondition] NOT CONTAINS: final result -> ${result}`);
      return result;
    }
      
    default:
      // console.log(`⚖️ [evaluateCondition] Unknown operator "${operator}", returning false`);
      return false;
  }
}

export function debugConditionalDisplay(
  allResponseInForms: Record<string, ResponseInForm>,
  display?: ConditionalDisplayGroup
): { result: boolean; details: any } {
  if (!display) {
    return { result: true, details: "No conditional display rules" };
  }

  const group = display;
  const rules = normalizeToArray(group.rules);

  const ruleResults = rules.map((rule) => {
    const { fieldName, formFieldId, value, operator, numeric_compare_to, typeComputation } = rule;

    // Utilisation de la fonction utilitaire normalisée
    const fieldKeys: string[] = normalizeToArray(fieldName).length > 0 
      ? normalizeToArray(fieldName) 
      : normalizeToArray(formFieldId);

    const values: ResponseInForm['responseValue'][] = fieldKeys
      .map(k => allResponseInForms[k]?.responseValue)
      .filter(v => v !== undefined);

    let finalValue: ResponseInForm['responseValue'] = values[0] || null;

    if (values.length > 1 && typeComputation) {
      if (typeComputation === "SOMME") {
        finalValue = values
          .map(v => convertToNumber(v))
          .reduce((acc, curr) => acc + curr, 0);
      } else if (typeComputation === "MULTIPLICATION") {
        finalValue = values
          .map(v => convertToNumber(v))
          .reduce((acc, curr) => acc * curr, 1);
      }
    }

    const result = evaluateCondition(finalValue, operator as ConditionalOperator, value, numeric_compare_to);

    return {
      fieldKeys,
      values,
      finalValue,
      operator,
      compareValue: value,
      numeric_compare_to,
      typeComputation,
      result
    };
  });

  const groupResult = group.logic === "AND"
    ? ruleResults.every(r => r.result)
    : ruleResults.some(r => r.result);

  return {
    result: groupResult,
    details: {
      logic: group.logic,
      rules: ruleResults,
      finalResult: groupResult
    }
  };
}



























