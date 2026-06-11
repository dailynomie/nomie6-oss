import type { UserContext } from './profiles/types'
import { get } from 'svelte/store'
import { LedgerStore } from '../ledger/LedgerStore'
import { TrackableStore } from '../trackable/TrackableStore'
import { UsageStore } from '../usage/UsageStore'
import dayjs from 'dayjs'

interface ContextHints {
  metrics?: string[]
  dateRange?: { from: string; to: string }
  component?: string
}

export async function buildContext(hints?: ContextHints): Promise<UserContext> {
  try {
    const metrics = await fetchMetrics(hints?.metrics, hints?.dateRange)
    const goals = await fetchGoals()
    const summary = buildSummary(metrics, goals)

    return {
      recentMetrics: metrics,
      goals,
      summary
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
    const trackables = get(TrackableStore)

    // Query logs from ledger
    const logs = await LedgerStore.query({
      start: range?.from ? dayjs(range.from) : dayjs().subtract(30, 'days'),
      end: range?.to ? dayjs(range.to) : dayjs()
    })

    const metrics: Record<string, unknown> = {}

    // Extract tokens from all logs and group by id
    const tokensByKey: Record<string, any[]> = {}
    logs.forEach((log: any) => {
      // Extract trackers
      if (log.trackers && log.trackers.length > 0) {
        log.trackers.forEach((token: any) => {
          if (!tokensByKey[token.id]) tokensByKey[token.id] = []
          tokensByKey[token.id].push(token.value)
        })
      }

      // Extract people
      if (log.people && log.people.length > 0) {
        log.people.forEach((token: any) => {
          const key = `@${token.id}`
          if (!tokensByKey[key]) tokensByKey[key] = []
          tokensByKey[key].push(token.value || 1)
        })
      }

      // Extract context
      if (log.context && log.context.length > 0) {
        log.context.forEach((token: any) => {
          const key = `+${token.id}`
          if (!tokensByKey[key]) tokensByKey[key] = []
          tokensByKey[key].push(token.value || 1)
        })
      }

      // Extract pointers
      if (log.pointers && log.pointers.length > 0) {
        log.pointers.forEach((token: any) => {
          const key = `^${token.id}`
          if (!tokensByKey[key]) tokensByKey[key] = []
          tokensByKey[key].push(token.value || 1)
        })
      }
    })

    if (keys && keys.length > 0) {
      for (const key of keys) {
        const tracker = trackables?.trackers?.[key]
        if (tracker && tokensByKey[key]) {
          const values = tokensByKey[key]
          metrics[key] = {
            label: tracker.label,
            count: values.length,
            recent: values.slice(-5)
          }
        }
      }
    } else {
      const trackers = trackables?.trackers || {}
      for (const [key, tracker] of Object.entries(trackers)) {
        if (tokensByKey[key]) {
          const values = tokensByKey[key]
          metrics[key] = {
            label: (tracker as any)?.label || key,
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
    const trackables = get(TrackableStore)
    const goals: string[] = []

    const trackers = trackables?.trackers || {}
    for (const tracker of Object.values(trackers)) {
      const t = tracker as any
      if (t?.max || t?.min || t?.goal) {
        goals.push(`${t.label}: ${t.goal || `Target ${t.max || t.min}`}`)
      }
    }

    return goals.slice(0, 5)
  } catch (err) {
    console.error('Error fetching goals:', err)
    return []
  }
}

function buildSummary(metrics: Record<string, unknown>, goals: string[]): string {
  const metricNames = Object.keys(metrics).join(', ')
  const activeGoals = goals.slice(0, 3).join('; ')

  if (!metricNames) {
    return 'No tracking data available yet.'
  }

  return (
    `The user is tracking: ${metricNames}. ` +
    (activeGoals ? `Active goals: ${activeGoals}.` : 'No active goals defined.')
  )
}
