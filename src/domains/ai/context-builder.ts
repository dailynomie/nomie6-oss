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
          metrics[key] = {
            label: (trackable as any).label,
            count: values.length,
            recent: values.slice(-5)
          }
        }
      }
    } else {
      const trackableEntries = Object.entries(trackables)

      for (const [key, trackable] of trackableEntries) {
        if (tokensByKey[key]) {
          const values = tokensByKey[key]
          metrics[key] = {
            label: (trackable as any)?.label || key,
            count: values.length,
            recent: values.slice(-3)
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
