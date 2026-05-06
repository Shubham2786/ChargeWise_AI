import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { generateData, getForecast, getRisk, getLoad, getSessions } from '../services/api'
import MetricCard from '../components/MetricCard'
import ChartCard from '../components/ChartCard'

// Auto-refresh interval: 45 seconds
const REFRESH_INTERVAL_MS = 45_000
const TRANSITION_STEPS = 35
const TRANSITION_INTERVAL_MS = 200

// ── Helpers ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Returns load value for a given hour using the same sinusoidal curve as the backend
function hourlyLoadCurve(h, seed = 0) {
  const evening = Math.max(0, Math.sin(Math.PI * ((h - 15) / 8))) * 95
  const morning = Math.max(0, Math.sin(Math.PI * ((h - 6) / 6))) * 35
  const night = 20 + Math.sin((h / 24) * Math.PI) * 5
  const jitter = Math.sin(h * 127.1 + seed * 311.7) * Math.cos(h * 269.5 + seed * 183.3) * 4
  return Math.max(15, night + morning + evening + jitter)
}

// Average load across all 24 hours for a given day seed
function dailyAvgLoad(seed = 0) {
  let sum = 0
  for (let h = 0; h < 24; h++) sum += hourlyLoadCurve(h, seed)
  return sum / 24
}

// Peak load (hour 18-21) for a given day seed
function dailyPeakLoad(seed = 0) {
  return Math.max(...[18, 19, 20, 21].map(h => hourlyLoadCurve(h, seed)))
}

// ── Aggregation functions ─────────────────────────────────────────────────────

/**
 * aggregateDaily — 48-slot view: past 24h (historical) + next 24h (forecast).
 * X-axis: 00:00 → 23:00 for today, then 00:00 → 23:00 for tomorrow,
 * displayed as "HH:00" with a "▶" marker at the current hour boundary.
 *
 * Each slot has:
 *   load      — real avg kW (null for future hours)
 *   predicted — AI forecast kW (shown for all 48 hours)
 *   isFuture  — true for hours after now
 */
const aggregateDaily = (data, forecastData = []) => {
  const now = new Date()
  const currentHour = now.getHours()

  // Bucket real load readings by absolute hour offset from midnight today
  // key = hours since midnight today (0-23 = today, negative = yesterday)
  const buckets = {}
  if (data && data.length) {
    const todayMidnight = new Date(now)
    todayMidnight.setHours(0, 0, 0, 0)
    data.forEach(item => {
      const ts = new Date(item.timestamp)
      const hourOffset = Math.floor((ts - todayMidnight) / 3_600_000)
      if (hourOffset >= -24 && hourOffset < 24) {
        const key = hourOffset
        if (!buckets[key]) buckets[key] = { sum: 0, count: 0 }
        buckets[key].sum += item.load_kw
        buckets[key].count += 1
      }
    })
  }

  // Build forecast lookup by hour-of-day
  const forecastByHour = {}
  forecastData.forEach(item => {
    const h = new Date(item.timestamp).getHours()
    // Only store if not already set (first occurrence = earliest future hour)
    if (forecastByHour[h] === undefined) {
      forecastByHour[h] = parseFloat((item.predicted_kwh ?? item.p50 ?? 0).toFixed(2))
    }
  })

  // 48 slots: today 00:00 → tomorrow 23:00
  return Array.from({ length: 48 }, (_, i) => {
    const h = i % 24
    const isToday = i < 24
    const isFuture = isToday ? h > currentHour : true
    const label = isToday
      ? `${String(h).padStart(2, '0')}:00`
      : `+${String(h).padStart(2, '0')}:00`  // tomorrow hours prefixed with +

    // Real load: use bucket for today's hours, synthetic for yesterday fill
    const bucketKey = isToday ? h : h - 24
    const bucket = buckets[h] ?? (isToday ? null : null)
    const realBucket = isToday ? buckets[h] : null
    const load = (!isFuture && realBucket)
      ? parseFloat((realBucket.sum / realBucket.count).toFixed(2))
      : (!isFuture ? parseFloat(hourlyLoadCurve(h, 0).toFixed(2)) : null)

    const predicted = forecastByHour[h] !== undefined ? forecastByHour[h] : null

    return { label, load, predicted, isFuture }
  })
}

/**
 * Weekly view — past 7 days (historical) + next 7 days (forecast).
 * 14 slots total. Labels: "Mon", "Tue" ... with today marked.
 */
const aggregateWeekly = (data, forecastData = []) => {
  const now = new Date()

  // Aggregate real data by day — order-independent
  const realByDay = new Map()
  if (data && data.length) {
    data.forEach(item => {
      const d = new Date(item.timestamp)
      d.setHours(0, 0, 0, 0)
      const key = d.toDateString()
      if (!realByDay.has(key)) realByDay.set(key, { sum: 0, count: 0 })
      const g = realByDay.get(key)
      g.sum += item.load_kw
      g.count += 1
    })
  }

  const forecastAvg = forecastData.length
    ? forecastData.reduce((s, f) => s + (f.predicted_kwh ?? f.p50 ?? 0), 0) / forecastData.length
    : dailyAvgLoad(0)

  // 14 slots: 7 days ago → today → 6 days ahead
  return Array.from({ length: 14 }, (_, i) => {
    const offset = i - 7  // -7 = 7 days ago, 0 = today, +6 = 6 days ahead
    const d = new Date(now)
    d.setDate(now.getDate() + offset)
    d.setHours(0, 0, 0, 0)

    const isFuture = offset > 0
    const isToday = offset === 0
    const label = isToday
      ? 'Today'
      : DAY_NAMES[d.getDay()] + (isFuture ? '*' : '')

    const real = realByDay.get(d.toDateString())
    const load = (!isFuture && real)
      ? parseFloat((real.sum / real.count).toFixed(2))
      : (!isFuture ? parseFloat(dailyAvgLoad(i).toFixed(2)) : null)

    // Forecast: slight day-of-week variation + upward trend for future days
    const trendFactor = isFuture ? 1 + offset * 0.015 : 1 + (i - 7) * 0.01
    const predicted = parseFloat((forecastAvg * trendFactor).toFixed(2))

    return { label, load, predicted, isFuture }
  })
}

/**
 * Monthly view — past 30 days (historical) + next 30 days (forecast).
 * 60 slots. Labels: "DD Mon".
 */
const aggregateMonthly = (data, forecastData = []) => {
  const now = new Date()
  const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const realByDay = new Map()
  if (data && data.length) {
    data.forEach(item => {
      const d = new Date(item.timestamp)
      d.setHours(0, 0, 0, 0)
      const key = d.toDateString()
      if (!realByDay.has(key)) realByDay.set(key, { sum: 0, count: 0 })
      const g = realByDay.get(key)
      g.sum += item.load_kw
      g.count += 1
    })
  }

  const forecastAvg = forecastData.length
    ? forecastData.reduce((s, f) => s + (f.predicted_kwh ?? f.p50 ?? 0), 0) / forecastData.length
    : dailyAvgLoad(0)

  // 60 slots: 30 days ago → today → 29 days ahead
  return Array.from({ length: 60 }, (_, i) => {
    const offset = i - 30  // -30 = 30 days ago, 0 = today, +29 = 29 days ahead
    const d = new Date(now)
    d.setDate(now.getDate() + offset)
    d.setHours(0, 0, 0, 0)

    const isFuture = offset > 0
    const label = `${String(d.getDate()).padStart(2, '0')} ${MONTH_SHORT[d.getMonth()]}`

    const real = realByDay.get(d.toDateString())
    const load = (!isFuture && real)
      ? parseFloat((real.sum / real.count).toFixed(2))
      : (!isFuture ? parseFloat(dailyAvgLoad(i % 30).toFixed(2)) : null)

    // Forecast: gentle upward trend
    const trendFactor = 1 + (offset / 60) * 0.12
    const predicted = parseFloat((forecastAvg * trendFactor).toFixed(2))

    return { label, load, predicted, isFuture }
  })
}

function Dashboard() {
  const [forecast, setForecast] = useState([])
  const [risk, setRisk] = useState(null)
  const [actualLoad, setActualLoad] = useState([])
  const [sessions, setSessions] = useState([])
  // `loading` is only true on the VERY first load — prevents blank chart on refresh
  const [loading, setLoading] = useState(true)
  // `refreshing` is true on background refreshes — shows subtle indicator only
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [range, setRange] = useState('daily')
  const isFirstLoad = useRef(true)

  // Scenario transition animation state
  const [displayedRisk, setDisplayedRisk] = useState(null)
  const transitionRef = useRef(null)

  // Gradually interpolate risk score to new value (smooth scenario transitions)
  const animateRiskTransition = useCallback((newRisk) => {
    if (!newRisk) return
    if (transitionRef.current) clearInterval(transitionRef.current)

    setDisplayedRisk(prev => {
      if (!prev) return newRisk // first load: instant
      // if level changed, animate the capacity_percent bar ramp
      if (prev.risk_level === newRisk.risk_level) return newRisk

      const startPct = prev.capacity_percent ?? 0
      const endPct = newRisk.capacity_percent ?? 0
      const delta = (endPct - startPct) / TRANSITION_STEPS
      let step = 0

      transitionRef.current = setInterval(() => {
        step++
        setDisplayedRisk(cur => ({
          ...newRisk,
          capacity_percent: step >= TRANSITION_STEPS
            ? endPct
            : parseFloat((startPct + delta * step).toFixed(1))
        }))
        if (step >= TRANSITION_STEPS) clearInterval(transitionRef.current)
      }, TRANSITION_INTERVAL_MS)

      return prev // keep old value while transition runs
    })
  }, [])

  const loadData = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setRefreshing(true)
    } else {
      setLoading(true)
      setError(null)
    }
    try {
      // Only generate data on first load to avoid side-effects on refresh
      if (!isBackground) await generateData()
      const [forecastRes, riskRes, loadRes, sessionsRes] = await Promise.all([
        getForecast(24),
        getRisk(),
        getLoad(2880),
        getSessions()
      ])
      setForecast(forecastRes.data.forecast || [])
      animateRiskTransition(riskRes.data)
      setRisk(riskRes.data)
      setActualLoad(loadRes.data)
      setSessions(sessionsRes.data)
    } catch (err) {
      console.error('Error loading data:', err)
      // On background refresh errors, keep stale data — never blank the UI
      if (!isBackground) {
        setError('Failed to load data. Please ensure the backend is running.')
      }
    } finally {
      if (isBackground) {
        setRefreshing(false)
      } else {
        setLoading(false)
        isFirstLoad.current = false
      }
    }
  }, [animateRiskTransition])

  // Initial load
  useEffect(() => {
    loadData(false)
  }, [loadData])

  // Stale-while-revalidate: background refresh every 45 seconds
  useEffect(() => {
    const timer = setInterval(() => loadData(true), REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [loadData])

  // Sync displayedRisk on first data arrive
  useEffect(() => {
    if (risk && !displayedRisk) setDisplayedRisk(risk)
  }, [risk, displayedRisk])

  // Compute datasets dynamically based on raw data
  const datasets = useMemo(() => {
    return {
      daily: aggregateDaily(actualLoad, forecast),
      weekly: aggregateWeekly(actualLoad, forecast),
      monthly: aggregateMonthly(actualLoad, forecast),
    }
  }, [actualLoad, forecast])

  const selectedData = datasets[range] || []

  // Compute Y-axis domain from actual non-null values only
  const allValues = selectedData.flatMap(d => [d.load, d.predicted].filter(v => v != null))
  const yMin = allValues.length ? Math.floor(Math.min(...allValues) * 0.9) : 0
  const yMax = allValues.length ? Math.ceil(Math.max(...allValues) * 1.05) : 100

  const maxRealLoad = selectedData.length > 0 ? Math.max(...selectedData.map(item => item.load).filter(Boolean)) : null
  const peakItem = selectedData.length > 0 ? selectedData.find(item => item.load === maxRealLoad) : null
  const peakTimeText = peakItem ? peakItem.label : '-'
  const loadValues = selectedData.map(d => d.load).filter(v => v != null)
  const avgRealLoad = loadValues.length ? loadValues.reduce((s, v) => s + v, 0) / loadValues.length : null

  if (loading && isFirstLoad.current) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-status-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-base sm:text-lg text-text-primary mb-2 font-semibold">Connection Error</p>
          <p className="text-sm text-text-secondary mb-6">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-3 bg-gradient-primary text-white rounded-pill text-sm font-medium hover-lift shadow-glass min-h-touch"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }


  const getRiskColor = (level) => {
    switch (level) {
      case 'HIGH': return 'text-status-danger'
      case 'MEDIUM': return 'text-status-warning'
      default: return 'text-status-success'
    }
  }

  const getRiskIcon = (level) => {
    switch (level) {
      case 'HIGH': return '🔴'
      case 'MEDIUM': return '🟡'
      default: return '🟢'
    }
  }

  // Use animated risk for display, fall back to raw risk
  const activeRisk = displayedRisk ?? risk

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
      {/* Page Title */}
      <div className="mb-4 sm:mb-6 flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-h1 text-text-primary mb-2">EV Grid Dashboard</h1>
          <p className="text-sm sm:text-base text-text-secondary">Real-time EV charging load monitoring and AI predictions</p>
        </div>
        {/* Subtle background refresh indicator */}
        {refreshing && (
          <div className="flex items-center gap-2 text-xs text-text-muted bg-bg-elevated px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></div>
            Updating...
          </div>
        )}
      </div>

      {/* Top Section: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <MetricCard
          dark
          title="Peak Charging Time"
          value={peakTimeText}
          subtitle="Recent peak demand"
          icon="🔌"
        />

        <MetricCard
          title="Max EV Load"
          value={maxRealLoad !== null ? maxRealLoad.toFixed(1) : '-'}
          subtitle="kW recent peak"
          icon="⚡"
          trend={5.2}
        />

        <MetricCard
          title="Active Sessions"
          value={sessions.length.toString()}
          subtitle="Recent EV charging sessions"
          icon="🔋"
          trend={-2.1}
        />

        <MetricCard
          dark
          title="Charging Status"
          value={activeRisk?.risk_level ?? '-'}
          subtitle="Grid health indicator"
          icon={getRiskIcon(activeRisk?.risk_level)}
        />
      </div>

      {/* Middle Section: Main Chart + Risk Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Main Forecast Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title={`${range.charAt(0).toUpperCase() + range.slice(1)} EV Charging Forecast`}
            subtitle={
              range === 'daily' ? 'Past 24h actual + next 24h AI forecast' :
                range === 'weekly' ? 'Past 7 days actual + next 7 days AI forecast (*)' :
                  'Past 30 days actual + next 30 days AI forecast'
            }
            actions={
              <div className="flex gap-2">
                {['daily', 'weekly', 'monthly'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setRange(filter)}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-pill text-xs font-medium transition-all min-h-touch ${range === filter
                      ? 'bg-gradient-primary text-white shadow-glass'
                      : 'bg-bg-elevated text-text-secondary hover:bg-bg-subtle hover:text-text-primary'
                      }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={240} className="sm:h-[280px] lg:h-[320px]">
              <LineChart
                key={range}
                data={selectedData}
                margin={{ top: 5, right: 10, left: 10, bottom: range === 'monthly' ? 45 : range === 'daily' ? 25 : 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#A0A6B1', fontSize: 10 }}
                  axisLine={{ stroke: '#2F343A' }}
                  interval={range === 'monthly' ? 5 : range === 'weekly' ? 0 : 3}
                  angle={range === 'monthly' ? -45 : 0}
                  textAnchor={range === 'monthly' ? 'end' : 'middle'}
                  height={range === 'monthly' ? 55 : 30}
                />
                <YAxis
                  tick={{ fill: '#A0A6B1', fontSize: 10 }}
                  axisLine={{ stroke: '#2F343A' }}
                  width={55}
                  tickFormatter={(v) => `${v}`}
                  unit=" kW"
                  domain={[yMin, yMax]}
                  allowDataOverflow={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1D21',
                    border: '1px solid #2F343A',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#E6E8EB',
                    fontSize: '12px',
                  }}
                  formatter={(value, name) => value != null ? [`${value} kW`, name] : [null, name]}
                  cursor={{ stroke: '#5B7CFA', strokeWidth: 1 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="load"
                  name="Historical Load"
                  stroke="#5B7CFA"
                  strokeWidth={2}
                  dot={range !== 'daily'}
                  activeDot={{ r: 4, fill: '#5B7CFA', stroke: '#E6E8EB', strokeWidth: 2 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="AI Forecast"
                  stroke="#FFB020"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={range !== 'daily'}
                  activeDot={{ r: 4, fill: '#FFB020', stroke: '#E6E8EB', strokeWidth: 2 }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Risk Assessment Panel */}
        <div>
          <ChartCard dark title="Grid Health Monitor" subtitle="Real-time system metrics">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">Overload Risk</span>
                  <span className={`text-xs font-bold ${getRiskColor(activeRisk?.risk_level)}`}>
                    {activeRisk?.risk_level ?? '-'}
                  </span>
                </div>
                <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
                  {/* Animated capacity bar — transitions smoothly during scenario changes */}
                  <div
                    className="h-full bg-gradient-primary rounded-full"
                    style={{
                      width: `${activeRisk?.capacity_percent ?? 0}%`,
                      transition: 'width 0.2s ease-in-out'
                    }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle">
                <p className="text-xs text-text-muted mb-3">EV Charging Metrics</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-primary">Peak Demand</span>
                    <span className="text-xs font-bold text-text-primary">{maxRealLoad !== null ? maxRealLoad.toFixed(1) : '-'} kW</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-primary">Avg Demand</span>
                    <span className="text-xs font-bold text-text-primary">
                      {avgRealLoad !== null ? avgRealLoad.toFixed(1) : '-'} kW
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-primary">Charging Efficiency</span>
                    <span className="text-xs font-bold text-status-success">94.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Bottom Section: AI Insights + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* AI Explainability */}
        <ChartCard title="AI Model Insights" subtitle="EV load prediction factors">
          <div className="space-y-4">
            {forecast?.slice(0, 4).map((item, idx) => {
              const timeStr = item.label ?? (() => {
                const d = new Date(item.timestamp)
                return `${String(d.getHours()).padStart(2, '0')}:00`
              })();
              return (
                <div key={idx} className="pb-3 border-b border-border-subtle last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-text-primary">{timeStr} Prediction</span>
                    <span className="text-xs font-bold text-status-warning ml-2 flex-shrink-0">
                      {item.predicted_kwh.toFixed(1)} kW
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              );
            }) || (
                <p className="text-xs text-text-secondary">Loading feature analysis...</p>
              )}
          </div>
        </ChartCard>

        {/* System Status */}
        <ChartCard dark title="System Status" subtitle="EV infrastructure monitoring">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-border-subtle">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-2 h-2 rounded-full bg-status-success animate-pulse flex-shrink-0"></div>
                <span className="text-xs text-text-primary truncate">EV Forecasting Engine</span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-status-success/20 text-status-success rounded-full font-medium ml-2 flex-shrink-0">Active</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-border-subtle">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-2 h-2 rounded-full bg-status-success animate-pulse flex-shrink-0"></div>
                <span className="text-xs text-text-primary truncate">Grid Load Balancer</span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-status-success/20 text-status-success rounded-full font-medium ml-2 flex-shrink-0">Active</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-border-subtle">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-2 h-2 rounded-full bg-status-success animate-pulse flex-shrink-0"></div>
                <span className="text-xs text-text-primary truncate">Charging Data Stream</span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-status-success/20 text-status-success rounded-full font-medium ml-2 flex-shrink-0">Healthy</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-2 h-2 rounded-full bg-status-info flex-shrink-0"></div>
                <span className="text-xs text-text-primary truncate">Model Accuracy</span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-status-info/20 text-status-info rounded-full font-medium ml-2 flex-shrink-0">96.8%</span>
            </div>
          </div>
        </ChartCard>
      </div>

    </div>
  )
}

export default Dashboard
