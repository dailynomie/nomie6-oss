import type { Profile, UserContext } from './types'

export const chatProfile: Profile = {
  name: 'chat',
  maxTokens: 1000,
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

    // Format contexts
    const contextsList = context.contexts
      ? Object.entries(context.contexts)
        .map(([key, data]: [string, any]) => `${key.substring(1)}: ${data.count} times`)
        .join(', ')
      : 'None tracked'

    // Format pointers
    const pointersList = context.pointers
      ? Object.entries(context.pointers)
        .map(([key, data]: [string, any]) => `${key.substring(1)}: ${data.count} occurrences`)
        .join(', ')
      : 'None tracked'

    // Format locations
    const locationsList = context.locations
      ? context.locations
        .map((loc: any) => {
          const name = loc.name || `${loc.lat?.toFixed(2)},${loc.lng?.toFixed(2)}`
          return `${name} (${loc.count} times, last: ${loc.lastUsed})`
        })
        .join(', ')
      : 'None tracked'

    return `You are a helpful AI assistant analyzing the user's comprehensive tracking data including metrics, locations, contexts, and journal entries.
Provide thoughtful, detailed responses (2-3 paragraphs is fine). Be friendly, encouraging, and insightful.
Reference specific metrics, patterns, locations, contexts, and journal entries to support your analysis.

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

Contexts (Situations/Environments): ${contextsList}

Pointers (Topics/References): ${pointersList}

Locations (Places/Coordinates): ${locationsList}

Journal Notes (last 14 days):
${context.notes || 'No notes available'}

Goals: ${context.goals.map((g) => `- ${g}`).join('\n') || 'None set'}

People: ${Object.keys(context.people || {}).join(', ') || 'None tracked'}

Spatial & Contextual Awareness: Use the location data (coordinates and names), contexts (environments), and pointers (topics) to understand WHERE and WHY the user was tracking. This provides richer insights into behavior patterns.

Provide analysis that helps the user understand patterns and connections between their metrics, locations, contexts, and behavior.`
  },

  parseResponse: (raw: string) => {
    return raw.trim()
  }
}
