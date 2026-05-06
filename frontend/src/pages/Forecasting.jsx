import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { getForecast, getProbabilisticForecast } from '../services/api'

export default function Forecasting() {
  const [horizon, setHorizon] = useState(24)
  const [probData, setProbData] = useState([])
  const [shap, setShap] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [probRes, fRes] = await Promise.all([
        getProbabilisticForecast(horizon),
        getForecast(horizon)
      ])
      const prob = probRes.data
      const forecast = fRes.data?.forecast ?? []

      // Merge p10/p50/p90 onto a single timeline
      const chart = prob.map((p, i) => {
        const d = new Date(p.timestamp)
        const label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const f = forecast[i]
        return {
          label,
          p10: parseFloat(p.p10.toFixed(2)),
          p50: parseFloat(p.p50.toFixed(2)),
          p90: parseFloat(p.p90.toFixed(2)),
          explanation: f?.explanation ?? null
        }
      })
      setProbData(chart)

      // Collect SHAP from forecast
      const shapItems = forecast.filter(f => f.explanation).slice(0, 5)
      setShap(shapItems)
    } catch (e) {
      setError('Failed to load forecast. Ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [horizon])

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
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1 text-text-primary mb-1">⚡ Demand Forecasting</h1>
          <p className="text-sm text-text-secondary">Probabilistic energy demand with uncertainty bounds</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Horizon:</span>
          {[12, 24, 48].map(h => (
            <button key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${
                horizon === h ? 'bg-gradient-primary text-white shadow-glass' : 'bg-bg-elevated text-text-secondary hover:bg-bg-subtle'
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

      {error && !loading && (
        <div className="glass-dark rounded-card p-6 text-center text-status-danger">{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'P10 (Low)', val: probData[0]?.p10 ?? '--', color: 'text-blue-400', icon: '📉' },
              { label: 'P50 (Median)', val: probData[0]?.p50 ?? '--', color: 'text-accent-primary', icon: '📊' },
              { label: 'P90 (High)', val: probData[0]?.p90 ?? '--', color: 'text-orange-400', icon: '📈' },
              { label: 'Horizon', val: `${horizon}h`, color: 'text-text-primary', icon: '🕐' },
            ].map(k => (
              <div key={k.label} className="glass-dark rounded-card p-4 hover-lift">
                <p className="text-xs text-text-muted mb-1">{k.icon} {k.label}</p>
                <p className={`text-2xl font-bold ${k.color}`}>{k.val} {k.val !== '--' && k.label !== 'Horizon' ? <span className="text-sm font-normal text-text-muted">kWh</span> : ''}</p>
              </div>
            ))}
          </div>

          {/* Probabilistic Chart */}
          <div className="bg-bg-card rounded-card p-5 shadow-glass mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Uncertainty Envelope — P10 / P50 / P90</h3>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={probData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: '#A0A6B1', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} interval={Math.floor(probData.length / 6)} />
                <YAxis tick={{ fill: '#A0A6B1', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="line" />
                <Line type="monotone" dataKey="p90" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="P90 (Upper)" />
                <Line type="monotone" dataKey="p50" stroke="#5B7CFA" strokeWidth={2.5} dot={false} name="P50 (Median)" />
                <Line type="monotone" dataKey="p10" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="P10 (Lower)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* SHAP Explanations */}
          {shap.length > 0 && (
            <div className="glass-dark rounded-card p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">🧠 AI Explanations (SHAP)</h3>
              <div className="space-y-3">
                {shap.map((item, i) => (
                  <div key={i} className="p-3 bg-bg-elevated rounded-button border border-border-subtle">
                    <p className="text-xs text-text-muted mb-1">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {parseFloat(item.predicted_kwh).toFixed(2)} kWh predicted
                    </p>
                    <p className="text-sm text-text-primary">{item.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
