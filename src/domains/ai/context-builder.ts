import type { UserContext } from './profiles/types'
import { get } from 'svelte/store'
import { LedgerStore } from '../ledger/LedgerStore'
import { TrackableStore } from '../trackable/TrackableStore'
import { UsageStore } from '../usage/UsageStore'
import { GoalStore } from '../goals/GoalStore'
import dayjs from 'dayjs'
import { tokenizeLite } from '../../modules/tokenizer/lite'

interface ContextHints {
  metrics?: string[]
  dateRange?: { from: string; to: string }
  component?: string
}

export interface NarrativeContextData {
  entries_by_date: Record<string, { notes: string[]; count: number }>
  total_entries: number
  date_range: { from: string; to: string }
  summary: string
}

export async function buildContext(hints?: ContextHints): Promise<UserContext> {
  try {
    const metrics = await fetchMetrics(hints?.metrics, hints?.dateRange)
    const goals = await fetchGoals()
    const people = await fetchPeople(hints?.dateRange)
    const summary = buildSummary(metrics, goals, people)

    return {
      recentMetrics: metrics,
      goals,
      summary,
      people
    }
  } catch (err) {
    console.error('Error building AI context:', err)
    return {
      recentMetrics: {},
      goals: [],
      summary: 'Unable to load user data at this time.'
    }
  }
}

export async function buildChatContext(hints?: ContextHints): Promise<UserContext> {
  try {
    const dateRange = hints?.dateRange || {
      from: dayjs().subtract(14, 'days').format('YYYY-MM-DD'),
      to: dayjs().format('YYYY-MM-DD')
    }

    const trackableStore = get(TrackableStore)
    const trackables = trackableStore.trackables || {}

    // Query logs with full date range
    const logs = await LedgerStore.query({
      start: dayjs(dateRange.from),
      end: dayjs(dateRange.to)
    })

    // Build daily metrics with dates for better temporal understanding
    const dailyMetrics: Record<string, Record<string, any>> = {}

    logs.forEach((log: any) => {
      if (!log.note) return
      const logDate = dayjs(log.end).format('YYYY-MM-DD')
      if (!dailyMetrics[logDate]) dailyMetrics[logDate] = {}

      const tokens = tokenizeLite(log.note)
      tokens.forEach((token: any) => {
        if (token.type !== 'tracker' && token.type !== 'person') return

        const key = `${token.prefix}${token.id}`
        if (!dailyMetrics[logDate][key]) {
          dailyMetrics[logDate][key] = { values: [], count: 0 }
        }
        dailyMetrics[logDate][key].values.push(token.value || 1)
        dailyMetrics[logDate][key].count++
      })
    })

    // Aggregate by applying tracker math rules
    const enrichedMetrics: Record<string, any> = {}
    Object.entries(dailyMetrics).forEach(([date, dayData]) => {
      Object.entries(dayData).forEach(([key, data]: [string, any]) => {
        if (!enrichedMetrics[key]) enrichedMetrics[key] = []

        const tracker = Object.values(trackables).find((t: any) => {
          return `${t.type === 'tracker' ? '#' : '@'}${t.tag}` === key
        }) as any

        let aggregated = data.values[0]
        if (tracker?.math === 'sum') {
          aggregated = data.values.reduce((a: number, b: number) => a + b, 0)
        } else if (tracker?.math === 'mean' || tracker?.math === 'average') {
          aggregated = data.values.reduce((a: number, b: number) => a + b, 0) / data.values.length
        }

        enrichedMetrics[key].push({ date, value: aggregated, count: data.count })
      })
    })

    // Also collect actual note content for journal analysis
    const notesByDate: Record<string, string[]> = {}
    logs.forEach((log: any) => {
      if (!log.note) return
      const logDate = dayjs(log.end).format('YYYY-MM-DD')
      if (!notesByDate[logDate]) notesByDate[logDate] = []
      notesByDate[logDate].push(log.note)
    })

    // Format notes for display
    const notesContent = Object.entries(notesByDate)
      .map(([date, notes]) => `${date}: ${notes.join(' | ')}`)
      .join('\n')

    const goals = await fetchGoals()
    const people = await fetchPeople(hints?.dateRange)
    const summary = buildSummary(enrichedMetrics, goals, people)

    return {
      recentMetrics: enrichedMetrics,
      goals,
      summary,
      people,
      notes: notesContent
    }
  } catch (err) {
    console.error('Error building chat context:', err)
    return {
      recentMetrics: {},
      goals: [],
      summary: 'Unable to load user data at this time.'
    }
  }
}

async function fetchMetrics(
  keys?: string[],
  range?: { from: string; to: string }
): Promise<Record<string, unknown>> {
  try {
    const trackableStore = get(TrackableStore)
    const trackables = trackableStore.trackables || {}

    // Query logs from ledger
    const logs = await LedgerStore.query({
      start: range?.from ? dayjs(range.from) : dayjs().subtract(30, 'days'),
      end: range?.to ? dayjs(range.to) : dayjs()
    })

    const metrics: Record<string, unknown> = {}

    // Extract tokens from all logs and group by id
    const tokensByKey: Record<string, any[]> = {}
    logs.forEach((log: any) => {
      if (!log.note) return

      // Parse note to extract tokens
      const tokens = tokenizeLite(log.note)

      tokens.forEach((token: any) => {
        // Skip non-trackable tokens
        if (token.type !== 'tracker' && token.type !== 'person' && token.type !== 'context' && token.type !== 'pointer') {
          return
        }

        // Build key with prefix - all trackables are stored with their prefix
        const key = `${token.prefix}${token.id}`

        if (!tokensByKey[key]) tokensByKey[key] = []
        const value = token.value !== undefined && token.value !== '' ? token.value : 1
        tokensByKey[key].push(value)
      })
    })


    if (keys && keys.length > 0) {
      for (const key of keys) {
        const trackable = trackables[key]
        if (trackable && tokensByKey[key]) {
          const values = tokensByKey[key]
          const aggregated = aggregateValues(values, trackable as any)
          metrics[key] = {
            label: (trackable as any).label,
            count: values.length,
            recent: values.slice(-5),
            aggregated: aggregated.value,
            aggregationType: aggregated.type
          }
        }
      }
    } else {
      const trackableEntries = Object.entries(trackables)

      for (const [key, trackable] of trackableEntries) {
        if (tokensByKey[key]) {
          const values = tokensByKey[key]
          const aggregated = aggregateValues(values, trackable as any)
          metrics[key] = {
            label: (trackable as any)?.label || key,
            count: values.length,
            recent: values.slice(-3),
            aggregated: aggregated.value,
            aggregationType: aggregated.type
          }
        }
      }
    }

    return metrics
  } catch (err) {
    console.error('Error fetching metrics:', err)
    return {}
  }
}

async function fetchGoals(): Promise<string[]> {
  try {
    const goals: string[] = []
    const goalMap = new Map<string, any>()

    // Get goals from GoalStore
    const goalStore = get(GoalStore)

    if (goalStore && Array.isArray(goalStore)) {
      for (let i = 0; i < goalStore.length; i++) {
        const g = goalStore[i] as any

        if (g && g.tag) {
          const durationLabel = g.duration ? `(${g.duration})` : '(daily)'
          const comparisonLabel = getComparisonLabel(g.comparison)
          const description = `${g.tag}: ${comparisonLabel} ${g.target}${g.unit || ''} ${durationLabel}`

          // Group by tag-duration to allow multiple goals per metric
          const key = `${g.tag}-${g.duration}`
          if (!goalMap.has(key)) {
            goalMap.set(key, description)
            goals.push(description)
          }
        }
      }
    }
    return goals.slice(0, 15)
  } catch (err) {
    console.error('Error fetching goals:', err)
    return []
  }
}

function aggregateValues(values: any[], tracker: any): { value: number; type: string } {
  if (!values || values.length === 0) {
    return { value: 0, type: 'empty' }
  }

  // Filter out zeros if tracker specifies to ignore them
  let processValues = values
  if (tracker?.ignore_zeros) {
    processValues = values.filter((v) => v !== 0 && v !== '0')
  }

  if (processValues.length === 0) {
    return { value: 0, type: 'empty' }
  }

  // Convert to numbers
  const numValues = processValues.map((v) => {
    const num = typeof v === 'string' ? parseFloat(v) : v
    return isNaN(num) ? 0 : num
  })

  // Aggregate based on tracker's math property
  const mathType = tracker?.math || 'sum'

  if (mathType === 'mean' || mathType === 'average') {
    const sum = numValues.reduce((a, b) => a + b, 0)
    const average = sum / numValues.length
    return { value: Math.round(average * 100) / 100, type: 'average' }
  }

  // Default to sum
  const sum = numValues.reduce((a, b) => a + b, 0)
  return { value: Math.round(sum * 100) / 100, type: 'sum' }
}

function getComparisonLabel(comparison?: string): string {
  const labels: Record<string, string> = {
    'gt': 'more than',
    'gte': 'at least',
    'lt': 'less than',
    'lte': 'at most',
    'eq': 'exactly'
  }
  return labels[comparison || ''] || 'target'
}

export async function buildNarrativeContext(hints?: ContextHints): Promise<NarrativeContextData> {
  try {
    const from = hints?.dateRange?.from ? dayjs(hints.dateRange.from) : dayjs().subtract(30, 'days')
    const to = hints?.dateRange?.to ? dayjs(hints.dateRange.to) : dayjs()

    // Query logs from ledger
    const logs = await LedgerStore.query({
      start: from,
      end: to
    })

    // Group notes by date, excluding purely metric notes
    const entries_by_date: Record<string, { notes: string[]; count: number }> = {}
    let total_entries = 0

    logs.forEach((log: any) => {
      if (!log.note) return

      // Extract the note text, filtering out pure tracker notation
      const noteText = log.note.trim()

      // Skip if it's just tracker entries with no actual text content
      const hasTextContent = /[a-zA-Z]{3,}/.test(noteText) // At least 3 consecutive letters
      if (!hasTextContent) return

      const dateKey = dayjs(log.end).format('YYYY-MM-DD')
      if (!entries_by_date[dateKey]) {
        entries_by_date[dateKey] = { notes: [], count: 0 }
      }

      entries_by_date[dateKey].notes.push(noteText)
      entries_by_date[dateKey].count++
      total_entries++
    })

    // Create summary
    const dates = Object.keys(entries_by_date).length
    const avgEntriesPerDay = dates > 0 ? Math.round((total_entries / dates) * 100) / 100 : 0
    const summary = `${total_entries} journal entries over ${dates} days (avg ${avgEntriesPerDay}/day)`

    return {
      entries_by_date,
      total_entries,
      date_range: {
        from: from.format('YYYY-MM-DD'),
        to: to.format('YYYY-MM-DD')
      },
      summary
    }
  } catch (err) {
    console.error('Error building narrative context:', err)
    return {
      entries_by_date: {},
      total_entries: 0,
      date_range: {
        from: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
        to: dayjs().format('YYYY-MM-DD')
      },
      summary: 'Unable to load journal entries'
    }
  }
}

async function fetchPeople(range?: { from: string; to: string }): Promise<Record<string, any> | undefined> {
  try {
    const logs = await LedgerStore.query({
      start: range?.from ? dayjs(range.from) : dayjs().subtract(30, 'days'),
      end: range?.to ? dayjs(range.to) : dayjs()
    })

    const peopleData: Record<string, any> = {}
    const moodMetrics = ['mood', 'happiness', 'energy', 'anxiety', 'stress']

    logs.forEach((log: any) => {
      if (!log.note) return
      const tokens = tokenizeLite(log.note)

      tokens.forEach((token: any) => {
        if (token.type === 'person') {
          const key = `@${token.id}`
          if (!peopleData[key]) {
            peopleData[key] = { values: [], dates: [] }
          }
          peopleData[key].values.push(token.value || 1)
          peopleData[key].dates.push(new Date(log.end))
        }
      })
    })

    // Convert to final format and calculate correlations
    const result: Record<string, any> = {}
    for (const [key, data] of Object.entries(peopleData)) {
      result[key] = {
        count: data.values.length,
        recent: data.values.slice(-3)
      }
    }

    return Object.keys(result).length > 0 ? result : undefined
  } catch (err) {
    console.error('Error fetching people data:', err)
    return undefined
  }
}

function buildSummary(metrics: Record<string, unknown>, goals: string[], people?: Record<string, any>): string {
  const metricNames = Object.keys(metrics)
    .filter(k => k.startsWith('#'))
    .map(k => k.substring(1))
    .join(', ')
  const personNames = people ? Object.keys(people).map(k => k.substring(1)).join(', ') : ''
  const activeGoals = goals.slice(0, 3).join('; ')

  let summary = ''

  if (metricNames) {
    summary += `The user is tracking: ${metricNames}. `
  }

  if (personNames) {
    summary += `Interactions with: ${personNames}. `
  }

  if (activeGoals) {
    summary += `Active goals: ${activeGoals}.`
  }

  if (!metricNames && !personNames) {
    summary = 'No tracking data available yet.'
  }

  return summary
}
