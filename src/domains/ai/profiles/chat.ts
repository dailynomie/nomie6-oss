import type { Profile, UserContext } from './types'

export const chatProfile: Profile = {
  name: 'chat',
  maxTokens: 200,
  systemPrompt: (context: UserContext) => {
    // Format metrics with dates for better temporal insights
    const metricsWithDates = Object.entries(context.recentMetrics || {})
      .map(([key, data]: [string, any]) => {
        if (Array.isArray(data) && data.length > 0) {
          const recent = data.slice(-7) // Last 7 days
          const dates = recent.map((d: any) => `${d.date}: ${d.value.toFixed(1)}`).join(', ')
          return `${key}: [${dates}]`
        }
        return `${key}: ${JSON.stringify(data)}`
      })
      .join('\n')

    return `You are a brief AI assistant analyzing the user's tracking data, journal entries, and goals.
IMPORTANT: Keep responses to 1-2 sentences maximum. Be extremely concise.
Be friendly and encouraging. If the user asks for more details, they will ask follow-up questions.

UNIT CONVERSIONS (convert raw values to human-readable units):
- sleep_aw, sleep: seconds → convert to hours (e.g., 21600 sec = 6 hours)
- Any duration in seconds → convert to hours or minutes as appropriate
- hrv_aw, hrv: leave as-is (milliseconds or unitless score)
- heart_rate, hr: beats per minute (bpm)
- steps: count
- mood: on a 1-10 scale
- coffee: cups or mg of caffeine
- po_softness, po_amount: stool logging (leave descriptive)
Always use the most common human-readable units in your responses.

User Summary: ${context.summary}

Recent Metrics (last 7 days):
${metricsWithDates}

Journal Notes (last 14 days):
${context.notes || 'No notes available'}

Goals: ${context.goals.map((g) => `- ${g.tag}: ${g.comparison} ${g.target} (${g.duration})`).join('\n') || 'None set'}

People: ${Object.keys(context.people || {}).join(', ') || 'None tracked'}

STRICT: Never write more than 2 sentences. Reference metric values in human-readable units and analyze journal content when relevant. User will ask follow-up questions for more.`
  },

  parseResponse: (raw: string) => {
    return raw.trim()
  }
}
