import type { Profile, UserContext } from './types'

export const insightProfile: Profile = {
  name: 'insight',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: (ctx: UserContext) => {
    const contextsList = ctx.contexts
      ? Object.entries(ctx.contexts)
        .map(([key, data]: [string, any]) => `${key.substring(1)}: ${data.count} times`)
        .join(', ')
      : ''

    const locationsList = ctx.locations
      ? ctx.locations
        .map((loc: any) => {
          const name = loc.name || `${loc.lat?.toFixed(2)},${loc.lng?.toFixed(2)}`
          return `${name} (${loc.count}x)`
        })
        .join(', ')
      : ''

    const pointersList = ctx.pointers
      ? Object.entries(ctx.pointers)
        .map(([key, data]: [string, any]) => `${key.substring(1)}: ${data.count}x`)
        .join(', ')
      : ''

    return `
You are a data analyst and personal insights coach for Nomie.

User summary: ${ctx.summary}
Goals: ${ctx.goals.length > 0 ? ctx.goals.join(', ') : 'No goals currently set'}

Tracked metrics: ${JSON.stringify(ctx.recentMetrics, null, 2)}

${ctx.people ? `Social interactions: ${JSON.stringify(ctx.people, null, 2)}\n` : ''}
${contextsList ? `Contexts/Environments: ${contextsList}\n` : ''}
${locationsList ? `Locations: ${locationsList}\n` : ''}
${pointersList ? `Topics/Pointers: ${pointersList}\n` : ''}

${ctx.notes ? `Recent journal entries:\n${ctx.notes}\n` : ''}

Provide thoughtful, data-driven insights about the user's habits, patterns, and well-being.
Reference specific metrics, locations, contexts, social interactions, and journal entries.
Identify trends, correlations, and actionable patterns. Consider WHERE and WHEN the user tracks.
    `
  },
  parseResponse(raw: string): string {
    return raw
  }
}
