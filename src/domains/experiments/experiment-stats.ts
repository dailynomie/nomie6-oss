import type { ExpectedDirection } from './experiment-class'

export type Verdict = 'not-enough-data' | 'clear' | 'hint' | 'no-clear-difference'
export type EffectLabel = 'negligible' | 'small' | 'medium' | 'large'

export type OutcomeResult = {
  tag: string
  direction: ExpectedDirection
  nB: number
  nE: number
  meanB: number
  meanE: number
  sdB: number
  sdE: number
  diff: number
  pct?: number
  ciLow: number
  ciHigh: number
  p: number
  d: number
  verdict: Verdict
  matchesExpectation?: boolean
  effect: EffectLabel
}

export const MIN_DAYS_PER_WINDOW = 7

const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61503916999385,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
]

/** Natural log of the gamma function (Lanczos approximation). */
export const logGamma = (z: number): number => {
  if (z < 0.5) {
    return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * z))) - logGamma(1 - z)
  }
  const zz = z - 1
  let x = LANCZOS[0]
  for (let i = 1; i < LANCZOS.length; i++) {
    x += LANCZOS[i] / (zz + i)
  }
  const t = zz + 7.5
  return 0.5 * Math.log(2 * Math.PI) + (zz + 0.5) * Math.log(t) - t + Math.log(x)
}

// Continued fraction for the incomplete beta function (Lentz's method)
const betaContinuedFraction = (a: number, b: number, x: number): number => {
  const EPS = 3e-16
  const FPMIN = 1e-300
  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1
  let d = 1 - (qab * x) / qap
  if (Math.abs(d) < FPMIN) d = FPMIN
  d = 1 / d
  let h = d
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < EPS) break
  }
  return h
}

/** Regularized incomplete beta function I_x(a, b). */
const regularizedBeta = (x: number, a: number, b: number): number => {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b)
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnBeta)
  if (x < (a + 1) / (a + b + 2)) {
    return (front * betaContinuedFraction(a, b, x)) / a
  }
  return 1 - (front * betaContinuedFraction(b, a, 1 - x)) / b
}

/** Cumulative distribution function of Student's t. */
export const tCdf = (t: number, df: number): number => {
  const x = df / (df + t * t)
  const tail = 0.5 * regularizedBeta(x, df / 2, 0.5)
  return t >= 0 ? 1 - tail : tail
}

/** Inverse of tCdf (bisection). */
export const tInv = (p: number, df: number): number => {
  let lo = -1000
  let hi = 1000
  for (let i = 0; i < 200 && hi - lo > 1e-10; i++) {
    const mid = (lo + hi) / 2
    if (tCdf(mid, df) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export const meanOf = (values: Array<number>): number =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0

/** Sample standard deviation (n - 1). Zero for fewer than two values. */
export const sdOf = (values: Array<number>): number => {
  if (values.length < 2) return 0
  const m = meanOf(values)
  const ss = values.reduce((sum, v) => sum + (v - m) * (v - m), 0)
  return Math.sqrt(ss / (values.length - 1))
}

export const effectLabel = (d: number): EffectLabel => {
  const size = Math.abs(d)
  if (size < 0.2) return 'negligible'
  if (size < 0.5) return 'small'
  if (size < 0.8) return 'medium'
  return 'large'
}

/**
 * Compare the baseline values (before) with the experiment values (during).
 * Never returns NaN: a window without variation gives p = 1, d = 0 when nothing changed,
 * and p = 0 with an infinite d when it did.
 */
export const compareWindows = (
  tag: string,
  direction: ExpectedDirection,
  b: Array<number>,
  e: Array<number>
): OutcomeResult => {
  const nB = b.length
  const nE = e.length
  const meanB = meanOf(b)
  const meanE = meanOf(e)
  const sdB = sdOf(b)
  const sdE = sdOf(e)
  const diff = meanE - meanB
  const pct = meanB === 0 ? undefined : (diff / meanB) * 100

  const vB = (sdB * sdB) / nB
  const vE = (sdE * sdE) / nE
  const se = Math.sqrt(vB + vE)
  const df =
    nB < 2 || nE < 2 ? Math.max(1, nB + nE - 2) : (vB + vE) ** 2 / ((vB * vB) / (nB - 1) + (vE * vE) / (nE - 1))

  const pooledSd = Math.sqrt(((nB - 1) * sdB * sdB + (nE - 1) * sdE * sdE) / Math.max(1, nB + nE - 2))

  let p: number
  let d: number
  let ciLow: number
  let ciHigh: number
  if (se === 0) {
    p = diff === 0 ? 1 : 0
    d = pooledSd === 0 ? (diff === 0 ? 0 : Math.sign(diff) * Infinity) : diff / pooledSd
    ciLow = diff
    ciHigh = diff
  } else {
    const t = diff / se
    p = 2 * (1 - tCdf(Math.abs(t), df))
    d = pooledSd === 0 ? (diff === 0 ? 0 : Math.sign(diff) * Infinity) : diff / pooledSd
    const crit = tInv(0.975, df)
    ciLow = diff - crit * se
    ciHigh = diff + crit * se
  }

  const enough = nB >= MIN_DAYS_PER_WINDOW && nE >= MIN_DAYS_PER_WINDOW
  const verdict: Verdict = !enough ? 'not-enough-data' : p < 0.05 ? 'clear' : p < 0.2 ? 'hint' : 'no-clear-difference'
  const matchesExpectation = direction === 'either' || diff === 0 ? undefined : direction === 'up' ? diff > 0 : diff < 0

  return {
    tag,
    direction,
    nB,
    nE,
    meanB,
    meanE,
    sdB,
    sdE,
    diff,
    pct,
    ciLow,
    ciHigh,
    p,
    d,
    verdict,
    matchesExpectation,
    effect: effectLabel(d),
  }
}
