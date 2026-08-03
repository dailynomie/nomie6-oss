/**
 * FormulaParser - Parses mathematical formulas and extracts dependencies
 *
 * Syntax:
 * - Trackers: #tag or #{tag} (e.g., #calories, #{daily_intake})
 * - Functions: sum(), count(), avg(), min(), max(), last()
 * - Manual variables: variable_name (any identifier not starting with #)
 * - Operators: +, -, *, /, (, ), ^
 *
 * Examples:
 * - "#calories - #exercise"
 * - "sum(#meals) / count(#workouts)"
 * - "#income - (#rent + #utilities + manual_other)"
 */

export interface ParsedFormula {
  formula: string
  trackerDependencies: string[] // Tags like ['calories', 'exercise']
  manualVariables: string[] // Variables like ['deficit', 'bonus']
  isValid: boolean
  error?: string
}

export class FormulaParser {
  /**
   * Parse a formula string and extract dependencies
   */
  static parse(formula: string): ParsedFormula {
    if (!formula || typeof formula !== 'string') {
      return {
        formula: formula || '',
        trackerDependencies: [],
        manualVariables: [],
        isValid: false,
        error: 'Formula is empty or invalid',
      }
    }

    const trimmed = formula.trim()
    if (!trimmed) {
      return {
        formula,
        trackerDependencies: [],
        manualVariables: [],
        isValid: false,
        error: 'Formula is empty',
      }
    }

    try {
      const trackerDependencies = this.extractTrackers(trimmed)
      const manualVariables = this.extractManualVariables(trimmed, trackerDependencies)
      const error = this.validateSyntax(trimmed)

      return {
        formula: trimmed,
        trackerDependencies,
        manualVariables,
        isValid: !error,
        error,
      }
    } catch (e) {
      return {
        formula: trimmed,
        trackerDependencies: [],
        manualVariables: [],
        isValid: false,
        error: `Parse error: ${e.message}`,
      }
    }
  }

  /**
   * Extract tracker references from formula
   * Matches: #tag or #{tag}
   */
  private static extractTrackers(formula: string): string[] {
    const trackers = new Set<string>()

    // Match #tag or #{tag}
    const regex = /#(\{)?([a-zA-Z0-9_-]+)(\})?/g
    let match

    while ((match = regex.exec(formula)) !== null) {
      const tag = match[2] // The captured tag name
      if (tag) {
        trackers.add(tag)
      }
    }

    return Array.from(trackers).sort()
  }

  /**
   * Extract manual variables from formula
   * Any identifier that's not a tracker, function name, or operator
   */
  private static extractManualVariables(
    formula: string,
    trackerDependencies: string[]
  ): string[] {
    const manualVars = new Set<string>()

    // Known functions
    const functions = new Set(['sum', 'count', 'avg', 'average', 'min', 'minimum', 'max', 'maximum', 'last'])

    // Remove tracker references to avoid matching them as variables
    let cleaned = formula.replace(/#\{?[a-zA-Z0-9_-]+\}?/g, '')

    // Match identifiers: sequences of letters, numbers, underscores starting with letter or underscore
    const regex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g
    let match

    while ((match = regex.exec(cleaned)) !== null) {
      const identifier = match[1]

      // Skip functions, operators, and reserved words
      if (
        !functions.has(identifier.toLowerCase()) &&
        !['and', 'or', 'not', 'if', 'then', 'else'].includes(identifier.toLowerCase())
      ) {
        manualVars.add(identifier)
      }
    }

    return Array.from(manualVars).sort()
  }

  /**
   * Basic syntax validation
   */
  private static validateSyntax(formula: string): string | undefined {
    // Check for balanced parentheses
    let parenCount = 0
    for (const char of formula) {
      if (char === '(') parenCount++
      if (char === ')') parenCount--
      if (parenCount < 0) {
        return 'Unmatched closing parenthesis'
      }
    }
    if (parenCount !== 0) {
      return 'Unmatched opening parenthesis'
    }

    // Check for empty parentheses
    if (/\(\s*\)/.test(formula)) {
      return 'Empty parentheses'
    }

    // Check for consecutive operators (very basic check)
    if (/[+\-*/]{2,}/.test(formula.replace(/--/g, ''))) {
      return 'Invalid operator sequence'
    }

    return undefined
  }

  /**
   * Normalize a formula for display
   * Converts #tag format to ensure consistency
   */
  static normalize(formula: string, trackerDependencies: string[]): string {
    let normalized = formula

    // Normalize tracker references to #tag format
    trackerDependencies.forEach(tag => {
      // Replace #{tag} with #tag
      normalized = normalized.replace(new RegExp(`\\#\\{${tag}\\}`, 'g'), `#${tag}`)
    })

    return normalized
  }

  /**
   * Get a human-readable description of formula dependencies
   */
  static describeDependencies(
    trackerDependencies: string[],
    manualVariables: string[]
  ): string {
    const parts: string[] = []

    if (trackerDependencies.length > 0) {
      parts.push(`Trackers: ${trackerDependencies.map(t => `#${t}`).join(', ')}`)
    }

    if (manualVariables.length > 0) {
      parts.push(`Variables: ${manualVariables.join(', ')}`)
    }

    return parts.length > 0 ? parts.join(' | ') : 'No dependencies'
  }
}

export default FormulaParser
