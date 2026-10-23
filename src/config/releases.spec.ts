import { describe, it, expect } from 'vitest'
import pkg from '../../package.json'
import releases from './releases.json'

// Every version logs its release date in releases.json. Add the entry when the version is bumped.
describe('release log', () => {
  it('has a release date for the version in package.json', () => {
    const entry = releases.find((release) => release.version === pkg.version)
    expect(entry, `add { "version": "${pkg.version}", "date": "YYYY-MM-DD" } to src/config/releases.json`).toBeTruthy()
    expect(entry!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('has no duplicate versions', () => {
    const versions = releases.map((release) => release.version)
    expect(new Set(versions).size).toBe(versions.length)
  })
})
