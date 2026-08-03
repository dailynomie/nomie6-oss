/**
 * CircularDependencyDetector - Detects circular dependencies in tracker formulas
 *
 * A circular dependency occurs when:
 * - Tracker A depends on B
 * - Tracker B depends on C
 * - Tracker C depends on A (cycle)
 */

import type TrackerClass from '../tracker/TrackerClass'

export interface CyclePath {
  trackers: string[] // Tag names in the cycle: ['A', 'B', 'C', 'A']
  chain: string // Human-readable: "A → B → C → A"
}

export interface CircularDependencyResult {
  hasCycle: boolean
  cycles: CyclePath[]
  affectedTrackers: string[] // All trackers involved in any cycle
}

export class CircularDependencyDetector {
  /**
   * Detect circular dependencies in a set of trackers
   */
  static detect(trackers: Map<string, TrackerClass>): CircularDependencyResult {
    const cycles: CyclePath[] = []
    const visited = new Set<string>()
    const affectedTrackers = new Set<string>()

    // Check each tracker for cycles
    for (const [tag, tracker] of trackers.entries()) {
      if (tracker.type === 'formula' && tracker.trackerDependencies) {
        const cycle = this.findCycle(tag, trackers, new Set())

        if (cycle) {
          cycles.push(cycle)
          cycle.trackers.forEach(t => affectedTrackers.add(t))
        }
      }
    }

    return {
      hasCycle: cycles.length > 0,
      cycles,
      affectedTrackers: Array.from(affectedTrackers),
    }
  }

  /**
   * Check if a specific formula tracker has a circular dependency
   */
  static checkTracker(tag: string, trackers: Map<string, TrackerClass>): CyclePath | null {
    return this.findCycle(tag, trackers, new Set())
  }

  /**
   * Find a cycle starting from a given tracker using DFS
   */
  private static findCycle(
    trackerTag: string,
    trackers: Map<string, TrackerClass>,
    path: Set<string>
  ): CyclePath | null {
    const tracker = trackers.get(trackerTag)

    if (!tracker || tracker.type !== 'formula' || !tracker.trackerDependencies) {
      return null
    }

    // Add current tracker to path
    const newPath = new Set(path)
    newPath.add(trackerTag)

    // Check each dependency
    for (const dep of tracker.trackerDependencies) {
      if (newPath.has(dep)) {
        // Found a cycle!
        const cycleStart = Array.from(newPath).indexOf(dep)
        const cyclePath = Array.from(newPath).slice(cycleStart)
        cyclePath.push(dep) // Close the cycle

        return {
          trackers: cyclePath,
          chain: cyclePath.join(' → '),
        }
      }

      // Recursively check dependencies
      const depTracker = trackers.get(dep)
      if (depTracker && depTracker.type === 'formula') {
        const cycle = this.findCycle(dep, trackers, newPath)
        if (cycle) {
          return cycle
        }
      }
    }

    return null
  }

  /**
   * Get all trackers that a given tracker depends on (transitively)
   */
  static getAllDependencies(trackerTag: string, trackers: Map<string, TrackerClass>): Set<string> {
    const dependencies = new Set<string>()
    const visited = new Set<string>()

    this.gatherDependencies(trackerTag, trackers, dependencies, visited)

    return dependencies
  }

  /**
   * Helper to transitively gather all dependencies
   */
  private static gatherDependencies(
    trackerTag: string,
    trackers: Map<string, TrackerClass>,
    dependencies: Set<string>,
    visited: Set<string>
  ): void {
    if (visited.has(trackerTag)) {
      return // Already processed, avoid infinite recursion
    }

    visited.add(trackerTag)

    const tracker = trackers.get(trackerTag)
    if (!tracker || tracker.type !== 'formula' || !tracker.trackerDependencies) {
      return
    }

    // Add direct dependencies
    tracker.trackerDependencies.forEach(dep => {
      dependencies.add(dep)

      // Recursively add transitive dependencies
      this.gatherDependencies(dep, trackers, dependencies, visited)
    })
  }

  /**
   * Get trackers that depend on a given tracker (reverse dependencies)
   */
  static getDependents(trackerTag: string, trackers: Map<string, TrackerClass>): Set<string> {
    const dependents = new Set<string>()

    for (const [tag, tracker] of trackers.entries()) {
      if (tracker.type === 'formula' && tracker.trackerDependencies?.includes(trackerTag)) {
        dependents.add(tag)

        // Add transitive dependents
        this.getDependents(tag, trackers).forEach(d => dependents.add(d))
      }
    }

    return dependents
  }

  /**
   * Create a human-readable description of the cycle
   */
  static describeCycle(cycle: CyclePath): string {
    return `Circular dependency detected: ${cycle.chain}`
  }

  /**
   * Check if updating a tracker would introduce new cycles
   */
  static wouldIntroduceCycle(
    trackerTag: string,
    newDependencies: string[],
    trackers: Map<string, TrackerClass>
  ): CyclePath | null {
    // Get all trackers that depend on this one
    const dependents = this.getDependents(trackerTag, trackers)

    // Check if any new dependency is in the dependents set
    for (const dep of newDependencies) {
      if (dependents.has(dep)) {
        // This would create a cycle: trackerTag → dep → ... → trackerTag
        const cycle = this.findCycle(dep, trackers, new Set([trackerTag]))
        if (cycle) {
          return cycle
        }
      }
    }

    return null
  }
}

export default CircularDependencyDetector
