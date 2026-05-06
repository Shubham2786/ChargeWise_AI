import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { getForecast, getProbabilisticForecast } from '../services/api'
import { useDemoData, useCountUp } from '../mock/useDemoData'
import { generateForecast, formatCurrency } from '../mock/dataGenerator'

export default function Forecasting() {
  const [horizon, setHorizon] = useState(24)

  const { data: probData, loading, source } = useDemoData(
    () => getProbabilisticForecast(horizon),
    (tick) => generateForecast(horizon, tick)
  )

  const [forecastData, setForecastData] = useState([])
  useEffect(() => {
    getForecast(horizon).then(r => setForecastData(r.data?.forecast ?? [])).catch(() => { })
  }, [horizon])

  // Build chart — merge probabilistic + SHAP explanations
  const chartData = (Array.isArray(probData) ? probData : []).map((p, i) => {
    // Use pre-computed label if available (from generateHourlyTimeline), else derive from timestamp
    const label = p.label ?? (() => {
      const d = new Date(p.timestamp)
      return `${String(d.getHours()).padStart(2, '0')}:00`
    })()
    return {
      label,
      p10: parseFloat((p.p10 ?? 0).toFixed(2)),
      p50: parseFloat((p.p50 ?? 0).toFixed(2)),
      p90: parseFloat((p.p90 ?? 0).toFixed(2)),
      explanation: p.explanation ?? forecastData[i]?.explanation ?? null,
    }
  })

  const shap = chartData.filter(d => d.explanation).slice(0, 4)
  const maxP90 = Math.max(...chartData.map(d => d.p90), 0)
  const p50Animated = useCountUp(chartData[0]?.p50 ?? 0)

  // Explicit Y-axis domain — prevents Recharts from scrambling the scale
  const allYValues = chartData.flatMap(d => [d.p10, d.p50, d.p90]).filter(v => v != null && v > 0)
  const yMin = allYValues.length ? Math.floor(Math.min(...allYValues) * 0.92) : 0
  const yMax = allYValues.length ? Math.ceil(Math.max(...allYValues) * 1.05) : 150

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: '#1A1D21', border: '1px solid #2F343A', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ color: '#A0A6B1', fontSize: 11, marginBottom: 6 }}>{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color, fontSize: 12, margin: '2px 0' }}>
            {p.name}: <strong>{p.value} kWh</strong>
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1 text-text-primary mb-1">⚡ Demand Forecasting</h1>
          <p className="text-sm text-text-secondary">
            Probabilistic energy demand with uncertainty bounds
            {source === 'mock' && <span className="ml-2 text-xs text-status-warning px-2 py-0.5 bg-status-warning/10 rounded-pill">Demo Mode</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Horizon:</span>
          {[12, 24, 48].map(h => (
            <button key={h} onClick={() => setHorizon(h)}
              className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${horizon === h ? 'bg-gradient-primary text-white shadow-glass' : 'bg-bg-elevated text-text-secondary hover:bg-bg-subtle'
                }`}
            >{h}h</button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'P10 Lower Bound', val: `${chartData[0]?.p10 ?? '--'} kWh`, color: 'text-blue-400', icon: '📉' },
              { label: 'P50 Median', val: `${p50Animated} kWh`, color: 'text-accent-primary', icon: '📊' },
              { label: 'P90 Upper Bound', val: `${chartData[0]?.p90 ?? '--'} kWh`, color: 'text-orange-400', icon: '📈' },
              { label: 'Max Forecast', val: `${maxP90.toFixed(1)} kWh`, color: 'text-text-primary', icon: '🎯' },
            ].map(k => (
              <div key={k.label} className="glass-dark rounded-card p-4 hover-lift">
                <p className="text-xs text-text-muted mb-1">{k.icon} {k.label}</p>
                <p className={`text-2xl font-bold ${k.color}`}>{k.val}</p>
              </div>
            ))}
          </div>

          {/* Probabilistic Chart */}
          <div className="bg-bg-card rounded-card p-5 shadow-glass mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Uncertainty Envelope — P10 / P50 / P90</h3>
            <p className="text-xs text-text-muted mb-4">Shaded band shows forecast confidence. Wider band = higher uncertainty during demand peaks.</p>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: '#A0A6B1', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} interval={Math.floor(chartData.length / 6)} />
                <YAxis tick={{ fill: '#A0A6B1', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} width={55} tickFormatter={(v) => `${v}`} unit=" kWh" domain={[yMin, yMax]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="line" />
                <Line type="monotone" dataKey="p90" stroke="#f97316" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="P90 Upper" />
                <Line type="monotone" dataKey="p50" stroke="#5B7CFA" strokeWidth={2.5} dot={false} name="P50 Median" activeDot={{ r: 5, fill: '#5B7CFA' }} />
                <Line type="monotone" dataKey="p10" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="P10 Lower" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* SHAP Explanations */}
          <div className="glass-dark rounded-card p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">🧠 AI Explanations (SHAP Feature Attribution)</h3>
            <div className="space-y-3">
              {(shap.length > 0 ? shap : chartData.slice(0, 3)).map((item, i) => (
                <div key={i} className="p-3 bg-bg-elevated rounded-button border border-border-subtle">
                  <p className="text-xs text-text-muted mb-1">{item.label} · {item.p50} kWh median forecast</p>
                  <p className="text-sm text-text-primary">
                    {item.explanation || 'Baseline load driven by temperature-adjusted historical patterns and time-of-day features.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
