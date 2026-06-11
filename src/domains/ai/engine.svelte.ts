import { buildContext } from './context-builder'
import { insightProfile } from './profiles/insight'
import { dataProfile } from './profiles/data'
import { adviceProfile } from './profiles/advice'
import { journalProfile } from './profiles/journal'
import { alertProfile } from './profiles/alert'
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
  alert: alertProfile
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
    const context = await buildContext(req.contextHints)

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: profile.maxTokens,
        temperature: profile.temperature,
        system: profile.systemPrompt(context),
        messages: [{ role: 'user', content: req.prompt }]
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const raw = data.content[0].text as string
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

    const response = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: profile.maxTokens,
        temperature: profile.temperature,
        system: profile.systemPrompt(context),
        messages: [{ role: 'user', content: req.prompt }]
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const lines = decoder.decode(value).split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const evt = JSON.parse(line.slice(6))
          if (evt.type === 'content_block_delta') {
            onChunk(evt.delta.text ?? '')
          }
        } catch {
          // ignore parse errors
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
