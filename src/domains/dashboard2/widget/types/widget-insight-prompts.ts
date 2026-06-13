export const INSIGHT_PROMPTS = {
  patterns: 'Identify 2-3 key patterns in my tracking data for this period.',
  progress: 'Summarize my progress towards my goals this period.',
  insights: 'Provide 2-3 key insights about my tracked metrics this period.',
  recommendations: 'Give 2-3 actionable recommendations based on my data.',
  trends: 'Analyze trends in my tracking data for this period.',
  wellbeing: 'Assess my overall wellbeing based on the data.',
  productivity: 'Comment on my productivity trends this period.',
  health: 'Provide health-related insights from my tracking data.',
  mood: 'Analyze mood and emotional patterns in my journal entries.',
  correlation: 'Identify correlations between different metrics this period.',
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
