import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { getAnomalies, getProbabilisticForecast } from '../services/api'

export default function AnomalyDetection() {
  const [chartData, setChartData] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [anomRes, forecastRes] = await Promise.all([getAnomalies(), getProbabilisticForecast(24)])
        const anom = anomRes.data ?? []
        const forecast = forecastRes.data ?? []

        setAnomalies(anom)

        // Build chart: P90 band and mark anomaly points
        const anomTimestamps = new Set(anom.map(a => new Date(a.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})))
        const chart = forecast.map(f => {
          const label = new Date(f.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
          return {
            label,
            p50: parseFloat(f.p50.toFixed(2)),
            p90: parseFloat(f.p90.toFixed(2)),
            isAnomaly: anomTimestamps.has(label)
          }
        })
        setChartData(chart)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" /></div>

  const AnomalyDot = (props) => {
    const { cx, cy, payload } = props
    if (!payload.isAnomaly) return null
    return <circle cx={cx} cy={cy} r={7} fill="#ef4444" stroke="#fff" strokeWidth={2} />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
      <div className="mb-6">
        <h1 className="text-h1 text-text-primary mb-1">🔍 Anomaly Detection</h1>
        <p className="text-sm text-text-secondary">Unexpected charging spikes exceeding P90 × 1.2 threshold</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Anomalies Detected', val: anomalies.length, color: anomalies.length > 0 ? 'text-status-danger' : 'text-status-success' },
          { label: 'Detection Threshold', val: 'P90 × 1.2', color: 'text-orange-400' },
          { label: 'Status', val: anomalies.length === 0 ? 'Normal' : 'Alert', color: anomalies.length > 0 ? 'text-status-danger' : 'text-status-success' },
          { label: 'Forecast Points', val: chartData.length, color: 'text-text-primary' },
        ].map(k => (
          <div key={k.label} className="bg-bg-card rounded-card p-4 hover-lift shadow-glass">
            <p className="text-xs text-text-muted mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Chart: Expected vs P90 band */}
      <div className="bg-bg-card rounded-card p-5 shadow-glass mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Expected vs Safety Envelope</h3>
        <p className="text-xs text-text-muted mb-4">Red dots = anomalies exceeding the P90 × 1.2 threshold</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: '#A0A6B1', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} interval={Math.floor(chartData.length/6)} />
            <YAxis tick={{ fill: '#A0A6B1', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} width={40} />
            <Tooltip contentStyle={{ background: '#1A1D21', border: '1px solid #2F343A', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="line" />
            <Line type="monotone" dataKey="p90" stroke="#f97316" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="P90 Safety Bound" />
            <Line type="monotone" dataKey="p50" stroke="#5B7CFA" strokeWidth={2} dot={<AnomalyDot />} name="P50 Expected" activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Anomaly list */}
      <div className="bg-bg-card rounded-card p-5 shadow-glass">
        <h3 className="text-sm font-semibold text-text-primary mb-4">🚨 Anomaly Log</h3>
        {anomalies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-sm text-text-secondary">No anomalies detected in the current window.</p>
            <p className="text-xs text-text-muted mt-1">All charging events are within expected P90 bounds.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((a, i) => (
              <div key={i} className="p-4 bg-status-danger/10 border border-status-danger/20 rounded-button">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-text-muted mb-1">{new Date(a.timestamp).toLocaleString()}</p>
                    <p className="text-sm font-semibold text-status-danger">{a.reason}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-text-muted">Actual</p>
                    <p className="text-lg font-bold text-status-danger">{a.actual?.toFixed(1)} kW</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
