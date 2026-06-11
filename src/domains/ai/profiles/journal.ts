import type { Profile, UserContext, JournalPrompt } from './types'

export const journalProfile: Profile = {
  name: 'journal',
  temperature: 0.5,
  maxTokens: 800,
  systemPrompt: (ctx: UserContext) => `
You are a thoughtful journal coach helping the user reflect on their day.

User summary: ${ctx.summary}
Goals: ${ctx.goals.length > 0 ? ctx.goals.join(', ') : 'No goals currently set'}
Tracked metrics: ${JSON.stringify(ctx.recentMetrics, null, 2)}
${ctx.people ? `\nSocial interactions: ${JSON.stringify(ctx.people, null, 2)}` : ''}

Generate 1 opening reflection question and 2-3 follow-up questions tailored to their data.
If social data available, ask about relationships and interactions.
Provide a mood scale label (e.g., "How are you feeling today?").

Return ONLY a JSON object with this exact structure:
{
  "opening_question": "thoughtful question about their day/data",
  "follow_up_questions": ["question 1", "question 2"],
  "mood_scale_label": "label for mood reflection"
}
  `,
  parseResponse(raw: string): JournalPrompt {
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as JournalPrompt
  }
}
