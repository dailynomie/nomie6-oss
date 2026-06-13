import { buildContext, buildChatContext, buildNarrativeContext } from './context-builder'
import { insightProfile } from './profiles/insight'
import { dataProfile } from './profiles/data'
import { adviceProfile } from './profiles/advice'
import { journalProfile } from './profiles/journal'
import { alertProfile } from './profiles/alert'
import { narrativeProfile } from './profiles/narrative'
import { chatProfile } from './profiles/chat'
import type {
  AIRequest,
  AIResponse,
  Profile,
  ProfileName
} from './profiles/types'
import { Prefs } from '../preferences/Preferences'
import { get } from 'svelte/store'
import Anthropic from '@anthropic-ai/sdk'
import dayjs from 'dayjs'
import { timeFrames } from '../dashboard2/widget/widget-timeframe'

const profiles: Record<ProfileName, Profile> = {
  insight: insightProfile,
  data: dataProfile,
  advice: adviceProfile,
  journal: journalProfile,
  alert: alertProfile,
  narrative: narrativeProfile,
  chat: chatProfile
}

function getDateRangeFromTimeframe(timeframeId: string): { from: string; to: string } {
  const timeframe = timeFrames.find(tf => tf.id === timeframeId)
  if (!timeframe) {
    return {
      from: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
      to: dayjs().format('YYYY-MM-DD')
    }
  }

  let start = dayjs()
  let end = dayjs()

  if (timeframe.start) {
    if (timeframe.start.subtract) {
      start = start.subtract(timeframe.start.subtract[0], timeframe.start.subtract[1] as any)
    }
    if (timeframe.start.startOf) {
      start = start.startOf(timeframe.start.startOf as any)
    }
  }

  if (timeframe.end) {
    if (timeframe.end.subtract) {
      end = end.subtract(timeframe.end.subtract[0], timeframe.end.subtract[1] as any)
    }
    if (timeframe.end.endOf) {
      end = end.endOf(timeframe.end.endOf as any)
    }
  }

  return {
    from: start.format('YYYY-MM-DD'),
    to: end.format('YYYY-MM-DD')
  }
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
    // Use different context building for different profiles
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
    } else if (req.profile === 'chat') {
      context = await buildChatContext(req.contextHints)
      systemPrompt = profile.systemPrompt(context)
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
  onChunk: (text: string) => void,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
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
    // Apply default timeframe if not specified in contextHints
    const contextHints = req.contextHints || {}
    if (!contextHints.dateRange) {
      const defaultTimeframe = prefs.ai?.defaultTimeframe || 'last-30'
      contextHints.dateRange = getDateRangeFromTimeframe(defaultTimeframe)
    }

    // Use richer context for chat profile
    const context = req.profile === 'chat'
      ? await buildChatContext(contextHints)
      : await buildContext(contextHints)

    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

    // Build messages array with conversation history
    const messages = [
      ...(conversationHistory || []),
      { role: 'user' as const, content: req.prompt }
    ]

    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: profile.maxTokens,
      system: profile.systemPrompt(context),
      messages
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
