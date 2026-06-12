import { buildContext, buildNarrativeContext } from './context-builder'
import { insightProfile } from './profiles/insight'
import { dataProfile } from './profiles/data'
import { adviceProfile } from './profiles/advice'
import { journalProfile } from './profiles/journal'
import { alertProfile } from './profiles/alert'
import { narrativeProfile } from './profiles/narrative'
import type {
  AIRequest,
  AIResponse,
  Profile,
  ProfileName
} from './profiles/types'
import { Prefs } from '../preferences/Preferences'
import { get } from 'svelte/store'

const profiles: Record<ProfileName, Profile> = {
  insight: insightProfile,
  data: dataProfile,
  advice: adviceProfile,
  journal: journalProfile,
  alert: alertProfile,
  narrative: narrativeProfile
}

export const aiState = $state({
  loading: false,
  error: null as string | null,
  lastResponse: null as AIResponse | null
})

export async function query<T = string>(req: AIRequest): Promise<AIResponse<T>> {
  const profile = profiles[req.profile]

  if (!profile) {
    throw new Error(`Unknown profile: ${req.profile}`)
  }

  const prefs = get(Prefs)
  const apiKey =
    prefs.ai?.services?.[prefs.ai?.selectedService || 'claude']?.apiKey

  if (!apiKey) {
    throw new Error(
      'AI is not configured. Please enable AI in Settings and add your API key.'
    )
  }

  aiState.loading = true
  aiState.error = null

  try {
    // Narrative profile uses different context building
    let context: any
    let systemPrompt: string

    if (req.profile === 'narrative') {
      const narrativeData = await buildNarrativeContext(req.contextHints)
      // Build a simplified context object for narrative
      context = {
        summary: narrativeData.summary,
        goals: [],
        recentMetrics: {},
        narrative_entries: narrativeData.entries_by_date
      }
      systemPrompt = `${profile.systemPrompt(context)}\n\nJournal entries to analyze:\n${JSON.stringify(narrativeData.entries_by_date, null, 2)}`
    } else {
      context = await buildContext(req.contextHints)
      systemPrompt = profile.systemPrompt(context)
    }

    // Use proxy API to avoid CORS issues
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: profile.maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: req.prompt }],
        apiKey
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'API request failed')
    }

    const data = await response.json()
    const raw = data.content[0].type === 'text' ? data.content[0].text : ''
    const content = profile.parseResponse(raw) as T

    const result: AIResponse<T> = {
      profile: req.profile,
      content,
      raw
    }

    aiState.lastResponse = result as AIResponse

    return result
  } catch (e) {
    const msg = (e as Error).message
    aiState.error = msg
    throw e
  } finally {
    aiState.loading = false
  }
}

export async function streamQuery(
  req: AIRequest,
  onChunk: (text: string) => void
): Promise<void> {
  const profile = profiles[req.profile]

  if (!profile) {
    throw new Error(`Unknown profile: ${req.profile}`)
  }

  const prefs = get(Prefs)
  const apiKey =
    prefs.ai?.services?.[prefs.ai?.selectedService || 'claude']?.apiKey

  if (!apiKey) {
    throw new Error(
      'AI is not configured. Please enable AI in Settings and add your API key.'
    )
  }

  aiState.loading = true
  aiState.error = null

  try {
    const context = await buildContext(req.contextHints)
    const systemPrompt = profile.systemPrompt(context)

    // Use proxy API for streaming to avoid CORS issues
    const response = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: profile.maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: req.prompt }],
        apiKey
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'API request failed')
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('Stream not available')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines[lines.length - 1]

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i]
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
              onChunk(data.delta.text)
            }
          } catch (e) {
            // Skip parsing errors
          }
        }
      }
    }
  } catch (e) {
    const msg = (e as Error).message
    aiState.error = msg
    throw e
  } finally {
    aiState.loading = false
  }
}
