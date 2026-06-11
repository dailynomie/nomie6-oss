import type { UserContext } from './profiles/types'
import { get } from 'svelte/store'
import { LedgerStore } from '../ledger/LedgerStore'
import { TrackableStore } from '../trackable/TrackableStore'
import { UsageStore } from '../usage/UsageStore'

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
    const ledger = get(LedgerStore)
    const trackables = get(TrackableStore)

    const metrics: Record<string, unknown> = {}

    if (keys && keys.length > 0) {
      for (const key of keys) {
        const tracker = trackables?.trackers?.[key]
        if (tracker) {
          const entries = ledger?.entries?.filter((e: any) => e.tag === key) || []
          metrics[key] = {
            label: tracker.label,
            count: entries.length,
            recent: entries.slice(-5).map((e: any) => e.value)
          }
        }
      }
    } else {
      const trackers = trackables?.trackers || {}
      for (const [key, tracker] of Object.entries(trackers)) {
        const entries = ledger?.entries?.filter((e: any) => e.tag === key) || []
        if (entries.length > 0) {
          metrics[key] = {
            label: (tracker as any)?.label || key,
            count: entries.length,
            recent: entries.slice(-3).map((e: any) => e.value)
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
