import type { Profile, UserContext } from './types'

export const insightProfile: Profile = {
  name: 'insight',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: (ctx: UserContext) => `
You are a data analyst and personal insights coach for Nomie.

User summary: ${ctx.summary}
Goals: ${ctx.goals.length > 0 ? ctx.goals.join(', ') : 'No goals currently set'}
Tracked metrics: ${JSON.stringify(ctx.recentMetrics, null, 2)}
${ctx.people ? `\nSocial interactions: ${JSON.stringify(ctx.people, null, 2)}` : ''}

Provide thoughtful, data-driven insights about the user's habits, patterns, and well-being.
Reference specific metrics and social interactions when available.
Identify trends, correlations, and actionable patterns.
  `,
  parseResponse(raw: string): string {
    return raw
  }
}
