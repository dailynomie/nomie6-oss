export const INSIGHT_PROMPTS = {
  patterns: 'Identify the TOP patterns in my tracking data for this period. Provide 3-4 sentences with specific details.',
  progress: 'Summarize my progress towards my goals this period in 3-4 sentences with concrete examples.',
  insights: 'Provide key insights about my tracked metrics this period. Keep to 3-4 sentences with specifics.',
  recommendations: 'Give 2-3 actionable recommendations based on my data. Provide 3-4 sentences total.',
  trends: 'Analyze the main trends in my tracking data for this period in 3-4 sentences.',
  wellbeing: 'Assess my overall wellbeing based on the data in 3-4 sentences with details.',
  productivity: 'Comment on my productivity trends this period in 3-4 sentences.',
  health: 'Provide key health insights from my tracking data in 3-4 sentences.',
  mood: 'Analyze the mood patterns in my journal entries in 3-4 sentences.',
  correlation: 'Identify key correlations between metrics this period in 3-4 sentences.',
}

export type PromptKey = keyof typeof INSIGHT_PROMPTS

export function getPromptText(key: PromptKey | string): string {
  if (key in INSIGHT_PROMPTS) {
    return INSIGHT_PROMPTS[key as PromptKey]
  }
  return key // Return custom prompt if not predefined
}

export function getPromptLabel(key: string): string {
  const labels: Record<string, string> = {
    patterns: 'Patterns',
    progress: 'Progress',
    insights: 'Insights',
    recommendations: 'Recommendations',
    trends: 'Trends',
    wellbeing: 'Wellbeing',
    productivity: 'Productivity',
    health: 'Health',
    mood: 'Mood & Emotions',
    correlation: 'Correlations',
  }
  return labels[key] || 'Custom Prompt'
}
