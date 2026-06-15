import type { Profile, UserContext } from './types'

export const chatProfile: Profile = {
  name: 'chat',
  maxTokens: 500,
  systemPrompt: (context: UserContext) => {
    return `You are a helpful AI assistant analyzing the user's tracking data and goals.
Keep responses concise and conversational - aim for 2-3 sentences maximum.
Be friendly and encouraging. If the user asks for more details, provide expanded analysis.

User Summary: ${context.summary}

Tracked Metrics: ${JSON.stringify(context.recentMetrics, null, 2)}

Goals: ${context.goals.map((g) => `- ${g.tag}: ${g.comparison} ${g.target} (${g.duration})`).join('\n') || 'None set'}

People: ${Object.keys(context.people || {}).join(', ') || 'None tracked'}

Keep responses brief and actionable. Reference actual metric values when answering. User can ask follow-up questions for deeper analysis.`
  },

  parseResponse: (raw: string) => {
    return raw.trim()
  }
}
