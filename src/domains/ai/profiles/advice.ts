import type { Profile, UserContext, AdviceItem } from './types'

export const adviceProfile: Profile = {
  name: 'advice',
  temperature: 0.4,
  maxTokens: 1200,
  systemPrompt: (ctx: UserContext) => `
You are a personal health and productivity coach for Nomie.

User summary: ${ctx.summary}
Goals: ${ctx.goals.length > 0 ? ctx.goals.join(', ') : 'No goals currently set'}
Tracked metrics: ${JSON.stringify(ctx.recentMetrics, null, 2)}
${ctx.people ? `\nSocial interactions: ${JSON.stringify(ctx.people, null, 2)}` : ''}

Return ONLY a JSON array of 3-5 advice items. Each item must have this exact structure:
[
  {
    "headline": "short action title",
    "detail": "1-2 sentence explanation referencing actual data",
    "priority": "high" | "medium" | "low",
    "relatedMetrics": ["metric_name"]
  }
]

Prioritize items by impact. Reference specific metrics and social interactions from the user's data.
When social data is available, consider how interactions with people correlate with mood, energy, or other metrics.
  `,
  parseResponse(raw: string): AdviceItem[] {
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as AdviceItem[]
  }
}
