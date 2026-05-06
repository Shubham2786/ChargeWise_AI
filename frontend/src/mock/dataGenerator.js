/**
 * ChargeWise AI — Deterministic Demo Data Engine
 * ------------------------------------------------
 * All values seeded via Math.sin/cos patterns so they look realistic
 * and vary slightly between refreshes without being truly random.
 */

// ── Seeded noise (deterministic, repeatable) ─────────────────────────────────
const noise = (x, amp = 1) => Math.sin(x * 127.1 + 311.7) * Math.cos(x * 269.5 + 183.3) * amp

// ── Bangalore zones for planning candidates ───────────────────────────────────
const ZONES = [
  { name: 'Koramangala',   lat: 12.9352, lon: 77.6245 },
  { name: 'Whitefield',    lat: 12.9698, lon: 77.7499 },
  { name: 'Indiranagar',   lat: 12.9784, lon: 77.6408 },
  { name: 'HSR Layout',    lat: 12.9116, lon: 77.6412 },
  { name: 'Electronic City', lat: 12.8399, lon: 77.6770 },
  { name: 'Marathahalli',  lat: 12.9591, lon: 77.6974 },
  { name: 'Hebbal',        lat: 13.0358, lon: 77.5970 },
]

// ── Grid capacity constant ────────────────────────────────────────────────────
export const GRID_CAPACITY_KW = 200

/**
 * Utility: generate a tick offset so every 5-second interval nudges data slightly.
 */
export const getTick = () => Math.floor(Date.now() / 5000)

/**
 * generateHourlyTimeline — centralized, deterministic timestamp generator.
 *
 * Returns an array of `horizonHours` objects, each with:
 *   - timestamp: ISO string (always sequential, no duplicates, no wrap bugs)
 *   - label:     "HH:MM" 24-hour label (e.g. "09:00", "23:00", "00:00")
 *   - hour:      0-23 integer for load curve calculations
 *
 * All charts across Forecasting, Risk, Pricing, Scheduling, Dashboard
 * must use this function as the single source of truth for x-axis labels.
 */
export function generateHourlyTimeline(horizonHours = 24, startFromNext = false) {
  // Round down to the current hour — stable within the same hour
  const base = new Date()
  base.setMinutes(0, 0, 0)

  // For forecasting, start from the next hour so all points are in the future
  const offset = startFromNext ? 1 : 0

  return Array.from({ length: horizonHours }, (_, i) => {
    const ts = new Date(base.getTime() + (i + offset) * 60 * 60 * 1000)
    const h  = ts.getHours()
    const label = `${String(h).padStart(2, '0')}:00`
    return { timestamp: ts.toISOString(), label, hour: h }
  })
}

/**
 * Core hourly load profile.
 * Pattern: low night → gentle morning rise → midday plateau → sharp evening peak → drop.
 */
export function generateHourlyLoad(tick = 0) {
  return Array.from({ length: 24 }, (_, h) => {
    const t      = h / 24
    // Evening peak (18-21h), morning shoulder (8-10h)
    const evening = Math.max(0, Math.sin(Math.PI * ((h - 15) / 8))) * 95
    const morning = Math.max(0, Math.sin(Math.PI * ((h - 6)  / 6))) * 35
    const night   = 20 + Math.sin(t * Math.PI) * 5
    const jitter  = noise(h + tick * 0.01, 6)

    const load = Math.max(15, night + morning + evening + jitter)
    return {
      hour:    `${String(h).padStart(2, '0')}:00`,
      load:    parseFloat(load.toFixed(1)),
      capacity: GRID_CAPACITY_KW,
    }
  })
}

/**
 * Probabilistic forecast: p10, p50, p90 bands.
 * Uses generateHourlyTimeline for stable, sequential x-axis labels.
 */
export function generateForecast(horizon = 24, tick = 0) {
  const timeline = generateHourlyTimeline(horizon, true)  // future hours only

  return timeline.map(({ timestamp, label, hour: h }) => {
    const evening = Math.max(0, Math.sin(Math.PI * ((h - 15) / 8))) * 90
    const morning = Math.max(0, Math.sin(Math.PI * ((h - 6)  / 6))) * 30
    const base    = 22 + morning + evening + noise(h + tick * 0.03, 5)

    const spread = 12 + (h >= 17 && h <= 21 ? 18 : 0)
    const p50    = Math.max(10, base)
    const p10    = Math.max(5,  p50 - spread * 0.7)
    const p90    = p50 + spread * 1.1

    return {
      timestamp,
      label,
      p10:           parseFloat(p10.toFixed(2)),
      p50:           parseFloat(p50.toFixed(2)),
      p90:           parseFloat(p90.toFixed(2)),
      predicted_kwh: parseFloat(p50.toFixed(2)),
      explanation:   h >= 17 && h <= 21
        ? `Peak driven by evening residential EV charging demand (${h}:00 surge)`
        : h >= 8 && h <= 10
          ? 'Morning office commute and commercial charging activity'
          : 'Low overnight baseline — majority of fleet idle',
    }
  })
}

/**
 * Smart scheduling: before vs after EDF optimisation.
 * Uses generateHourlyTimeline for consistent x-axis alignment with forecast.
 */
export function generateSchedule(tick = 0) {
  const timeline = generateHourlyTimeline(24)
  let uncontrolledPeak = 0
  let optimisedPeak    = 0

  const schedule = timeline.map(({ timestamp, label, hour: h }) => {
    // Derive load from the same curve as generateHourlyLoad
    const evening = Math.max(0, Math.sin(Math.PI * ((h - 15) / 8))) * 95
    const morning = Math.max(0, Math.sin(Math.PI * ((h - 6)  / 6))) * 35
    const night   = 20 + Math.sin((h / 24) * Math.PI) * 5
    const load    = Math.max(15, night + morning + evening + noise(h + tick * 0.01, 6))

    const uncontrolled = parseFloat((load * 1.45 + noise(h + tick, 8)).toFixed(1))
    const optimised    = parseFloat((Math.min(load * 1.08, GRID_CAPACITY_KW * 0.82) + noise(h * 2 + tick, 3)).toFixed(1))
    uncontrolledPeak   = Math.max(uncontrolledPeak, uncontrolled)
    optimisedPeak      = Math.max(optimisedPeak, optimised)
    return {
      timestamp,
      label,
      uncontrolled_load_kw: Math.max(15, uncontrolled),
      total_load_kw:        Math.max(12, optimised),
      status:               optimised > GRID_CAPACITY_KW * 0.9 ? 'at_risk' : 'normal',
      session_allocations:  {},
    }
  })

  const reduction = ((uncontrolledPeak - optimisedPeak) / uncontrolledPeak) * 100
  return {
    schedule,
    peak_reduction_percent: parseFloat(reduction.toFixed(1)),
    uncontrolled_peak:      parseFloat(uncontrolledPeak.toFixed(1)),
    optimized_peak:         parseFloat(optimisedPeak.toFixed(1)),
  }
}

/**
 * Grid risk evaluation derived from forecast.
 */
export function generateRisk(tick = 0) {
  const forecast = generateForecast(24, tick)
  const maxP90   = Math.max(...forecast.map(f => f.p90))
  const maxP50   = Math.max(...forecast.map(f => f.p50))

  let risk_level  = 'LOW'
  let probability = 0.05 + noise(tick, 0.04)

  if (maxP90 > GRID_CAPACITY_KW) {
    risk_level  = 'HIGH'
    probability = Math.min(0.95, 0.55 + noise(tick, 0.12))
  } else if (maxP50 > GRID_CAPACITY_KW * 0.8) {
    risk_level  = 'MEDIUM'
    probability = Math.min(0.65, 0.28 + noise(tick, 0.08))
  }

  const details = forecast.map(f => ({
    timestamp:  f.timestamp,
    risk:       f.p90 > GRID_CAPACITY_KW ? 'HIGH' : f.p50 > GRID_CAPACITY_KW * 0.8 ? 'MEDIUM' : 'LOW',
  }))

  return {
    risk_level,
    probability: parseFloat(Math.abs(probability).toFixed(3)),
    details,
  }
}

/**
 * Dynamic pricing in both ₹ and $ per kWh.
 * Price tracks load with a multiplier.
 */
export function generatePricing(tick = 0) {
  return generateForecast(24, tick).map(f => {
    const ratio      = f.p50 / GRID_CAPACITY_KW
    const base_inr   = 7
    const inr        = parseFloat((base_inr * (0.5 + ratio * 2.5) + noise(f.p50 + tick, 0.4)).toFixed(2))
    const usd        = parseFloat((inr * 0.012).toFixed(4))   // 1 INR ≈ 0.012 USD
    return {
      timestamp: f.timestamp,
      price:     inr,       // used as "raw" price in pages
      price_inr: inr,
      price_usd: usd,
    }
  })
}

/**
 * Infrastructure planning candidates (Bangalore zones).
 */
export function generatePlanningCandidates(tick = 0) {
  return ZONES.map((z, i) => {
    const demand = 0.55 + noise(i + tick * 0.001, 0.3)
    const growth = 0.40 + noise(i * 3 + tick * 0.001, 0.35)
    const score  = Math.min(0.98, Math.max(0.45, demand * 0.45 + growth * 0.35 + 0.2))

    const reasons = []
    if (demand > 0.6) reasons.push('High demand')
    if (growth  > 0.5) reasons.push('Rapid growth')
    if (i % 3 === 0)  reasons.push('Underserved area')
    if (reasons.length === 0) reasons.push('Balanced metrics')

    return {
      location:   `${z.lat.toFixed(4)}, ${z.lon.toFixed(4)}`,
      zone_name:  z.name,
      score:      parseFloat(score.toFixed(3)),
      score_pct:  Math.round(score * 100),
      reason:     reasons.join(' + '),
      lat:        z.lat + noise(i + tick * 0.001, 0.001),
      lon:        z.lon + noise(i * 7 + tick * 0.001, 0.001),
    }
  }).sort((a, b) => b.score - a.score)
}

/**
 * Anomaly detection: inject 2–3 spikes into a 24h window.
 */
export function generateAnomalies(tick = 0) {
  const baseHours = [7, 14, 20]  // fixed spike hours so chart is readable
  const forecast  = generateForecast(24, tick)

  return baseHours.slice(0, 2 + (tick % 2)).map((h, i) => {
    const f       = forecast[h] ?? forecast[0]
    const actual  = parseFloat((f.p90 * (1.3 + noise(h + i + tick, 0.15))).toFixed(1))
    return {
      timestamp:   f.timestamp,
      anomaly:     true,
      actual,
      expected_p90: f.p90,
      reason:      h < 10
        ? `Morning surge — ${actual.toFixed(0)} kW exceeded safety bound of ${(f.p90 * 1.2).toFixed(0)} kW`
        : h < 16
          ? `Midday event charging spike — fleet arrival at commercial hub`
          : `Evening peak overrun — residential demand clustered unexpectedly`,
    }
  })
}

/**
 * Hierarchical forecast: stations → zones → system.
 * sum(stations) ≈ system (with small rounding).
 */
export function generateHierarchy(tick = 0) {
  const stationIds = ['ACN-001', 'ACN-002', 'ACN-003', 'ACN-004', 'ACN-005']
  const systemForecast = generateForecast(24, tick)

  const stationForecasts = {}
  stationIds.forEach((st, si) => {
    stationForecasts[st] = systemForecast.map(f => {
      const share = (0.15 + noise(si * 31 + tick, 0.06))
      return {
        timestamp: f.timestamp,
        p10: parseFloat((f.p10 * share).toFixed(2)),
        p50: parseFloat((f.p50 * share).toFixed(2)),
        p90: parseFloat((f.p90 * share).toFixed(2)),
        fallback_active: false,
      }
    })
  })

  return {
    system_forecast:  systemForecast,
    station_forecasts: stationForecasts,
  }
}

/**
 * Executive dashboard KPIs.
 */
export function generateDashboardKPIs(tick = 0) {
  const now      = new Date()
  const h        = now.getHours()
  const isEvening = h >= 17 && h <= 21

  const activeSessions = 40 + Math.round(noise(tick, 18)) + (isEvening ? 25 : 0)
  const currentLoad    = parseFloat((55 + noise(tick * 0.5, 12) + (isEvening ? 90 : 30)).toFixed(1))
  const risk           = currentLoad > 160 ? 'HIGH' : currentLoad > 120 ? 'MEDIUM' : 'LOW'

  return {
    activeSessions:  Math.abs(activeSessions),
    currentLoad_kw:  Math.abs(currentLoad),
    peakHours:       '18:00 – 21:00',
    gridCapacity_kw: GRID_CAPACITY_KW,
    risk,
    energyToday_kwh: parseFloat((currentLoad * (h + 1) * 0.85).toFixed(1)),
    costToday_inr:   parseFloat((currentLoad * (h + 1) * 0.85 * 8.5).toFixed(0)),
  }
}

/**
 * Unified dashboard summary (mirrors /v1/dashboard/summary).
 */
export function generateDashboardSummary(tick = 0) {
  return {
    forecast:          generateForecast(24, tick),
    risk:              generateRisk(tick),
    pricing:           generatePricing(tick),
    schedule:          generateSchedule(tick),
    anomalies:         generateAnomalies(tick),
    planning_candidates: generatePlanningCandidates(tick),
  }
}

/**
 * Currency formatter.
 * formatCurrency(12.5, 'INR') → '₹12.50'
 * formatCurrency(0.18, 'USD') → '$0.18'
 */
export function formatCurrency(value, type = 'INR', decimals = 2) {
  const v = parseFloat(value).toFixed(decimals)
  return type === 'USD' ? `$${v}` : `₹${v}`
}
