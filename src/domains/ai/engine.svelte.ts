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
import Anthropic from '@anthropic-ai/sdk'

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

    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: profile.maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: req.prompt }]
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
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

    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: profile.maxTokens,
      system: profile.systemPrompt(context),
      messages: [{ role: 'user', content: req.prompt }]
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        onChunk(chunk.delta.text)
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
