/**
 * FormulaEvaluator - Evaluates mathematical formulas with tracker values
 *
 * Supports functions: sum(), count(), avg(), min(), max(), last()
 * Supports operators: +, -, *, /, ^, (), and nested expressions
 */

export interface EvaluationContext {
  trackerValues: { [tag: string]: number | number[] } // Tracker tag -> value or values array
  manualVariables?: { [variableName: string]: number } // Manual variable values
}

export interface EvaluationResult {
  value: number | null
  isValid: boolean
  error?: string
}

export class FormulaEvaluator {
  /**
   * Evaluate a formula with given context
   */
  static evaluate(formula: string, context: EvaluationContext): EvaluationResult {
    if (!formula || typeof formula !== 'string') {
      return {
        value: null,
        isValid: false,
        error: 'Formula is empty or invalid',
      }
    }

    try {
      // Replace tracker references with values
      let expression = this.substituteTrackers(formula, context.trackerValues)

      // Replace manual variables with values
      expression = this.substituteVariables(expression, context.manualVariables || {})

      // Evaluate the expression
      const value = this.evaluateExpression(expression)

      if (value === null || isNaN(value)) {
        return {
          value: null,
          isValid: false,
          error: 'Formula evaluation resulted in an invalid value',
        }
      }

      return {
        value,
        isValid: true,
      }
    } catch (e) {
      return {
        value: null,
        isValid: false,
        error: `Evaluation error: ${e.message}`,
      }
    }
  }

  /**
   * Replace tracker references (#tag) with their values
   */
  private static substituteTrackers(
    formula: string,
    trackerValues: { [tag: string]: number | number[] }
  ): string {
    let result = formula

    // Process each tracker value
    for (const [tag, value] of Object.entries(trackerValues)) {
      // Replace #tag and #{tag} with the actual value
      const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const patterns = [
        new RegExp(`#\\{${escaped}\\}`, 'g'), // #{tag}
        new RegExp(`#${escaped}\\b`, 'g'), // #tag (word boundary)
      ]

      let processedValue: string

      if (Array.isArray(value)) {
        // If value is an array, convert to function-friendly format
        // sum([1,2,3]) → (1+2+3), count([1,2,3]) → 3, etc.
        processedValue = `[${value.join(',')}]`
      } else {
        processedValue = String(value ?? 0)
      }

      patterns.forEach(pattern => {
        result = result.replace(pattern, processedValue)
      })
    }

    return result
  }

  /**
   * Replace manual variable references with their values
   */
  private static substituteVariables(
    expression: string,
    manualVariables: { [name: string]: number }
  ): string {
    let result = expression

    for (const [varName, value] of Object.entries(manualVariables)) {
      // Replace variable_name with value (word boundary)
      const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`\\b${escaped}\\b`, 'g')
      result = result.replace(pattern, String(value ?? 0))
    }

    return result
  }

  /**
   * Evaluate mathematical expression
   * Supports: +, -, *, /, ^, (), array functions
   */
  private static evaluateExpression(expr: string): number | null {
    const trimmed = expr.trim()

    if (!trimmed) {
      return null
    }

    // Handle array functions before general evaluation
    let processed = this.processArrayFunctions(trimmed)

    try {
      // Use Function constructor for safe evaluation of mathematical expressions
      // This is safer than eval() but still needs careful input validation
      // For production, consider using a dedicated math expression library

      // Create a safe evaluation context
      const context = {
        sum: (arr: number[]) => arr.reduce((a, b) => a + b, 0),
        count: (arr: number[]) => arr.filter(x => x !== 0 && !isNaN(x)).length,
        avg: (arr: number[]) => {
          const filtered = arr.filter(x => !isNaN(x))
          return filtered.length > 0 ? filtered.reduce((a, b) => a + b, 0) / filtered.length : 0
        },
        average: (arr: number[]) => {
          const filtered = arr.filter(x => !isNaN(x))
          return filtered.length > 0 ? filtered.reduce((a, b) => a + b, 0) / filtered.length : 0
        },
        min: (arr: number[]) => {
          const filtered = arr.filter(x => !isNaN(x))
          return filtered.length > 0 ? Math.min(...filtered) : 0
        },
        minimum: (arr: number[]) => {
          const filtered = arr.filter(x => !isNaN(x))
          return filtered.length > 0 ? Math.min(...filtered) : 0
        },
        max: (arr: number[]) => {
          const filtered = arr.filter(x => !isNaN(x))
          return filtered.length > 0 ? Math.max(...filtered) : 0
        },
        maximum: (arr: number[]) => {
          const filtered = arr.filter(x => !isNaN(x))
          return filtered.length > 0 ? Math.max(...filtered) : 0
        },
        last: (arr: number[]) => (arr.length > 0 ? arr[arr.length - 1] : 0),
        Math: Math,
      }

      // Create a function to evaluate the expression safely
      // eslint-disable-next-line no-new-func
      const fn = new Function(...Object.keys(context), `return ${processed}`)
      const result = fn(...Object.values(context))

      return typeof result === 'number' && isFinite(result) ? result : null
    } catch (e) {
      throw new Error(`Invalid expression: ${e.message}`)
    }
  }

  /**
   * Process array functions (sum, count, avg, min, max, last)
   * Converts function calls with arrays to actual array operations
   */
  private static processArrayFunctions(expr: string): string {
    let result = expr

    // Replace array function calls
    // Match: functionName([...])
    const arrayFunctionPattern = /\b(sum|count|avg|average|min|minimum|max|maximum|last)\s*\(\s*\[(.*?)\]\s*\)/g

    result = result.replace(arrayFunctionPattern, (match, func, arrayContent) => {
      const arr = `[${arrayContent}]`
      return `${func}(${arr})`
    })

    return result
  }
}

export default FormulaEvaluator
