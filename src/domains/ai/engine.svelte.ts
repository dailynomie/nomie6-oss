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
    console.log('🚀 Starting query:', { profile: req.profile, hasApiKey: !!apiKey })

    // Narrative profile uses different context building
    let context: any
    let systemPrompt: string

    if (req.profile === 'narrative') {
      console.log('📖 Building narrative context...')
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
      console.log('📊 Building context...')
      context = await buildContext(req.contextHints)
      systemPrompt = profile.systemPrompt(context)
    }

    console.log('🔑 Creating Anthropic client...')
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

    console.log('📤 Sending message to Claude...')
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: profile.maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: req.prompt }]
    })

    console.log('✅ Response received:', { contentType: response.content[0].type })

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
    console.error('❌ Query error:', msg, e)
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
    console.log('🚀 Starting stream query:', { profile: req.profile, hasApiKey: !!apiKey })

    const context = await buildContext(req.contextHints)
    console.log('📊 Context built:', { summary: context.summary?.substring(0, 100) })

    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
    console.log('🔑 Anthropic client created')

    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: profile.maxTokens,
      system: profile.systemPrompt(context),
      messages: [{ role: 'user', content: req.prompt }]
    })

    console.log('📡 Stream started')
    let chunkCount = 0

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        chunkCount++
        onChunk(chunk.delta.text)
      }
    }

    console.log('✅ Stream complete, chunks received:', chunkCount)
  } catch (e) {
    const msg = (e as Error).message
    console.error('❌ Stream error:', msg, e)
    aiState.error = msg
    throw e
  } finally {
    aiState.loading = false
  }
}
