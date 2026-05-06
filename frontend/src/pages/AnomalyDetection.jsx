import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getAnomalies, getProbabilisticForecast } from '../services/api'
import { useDemoData } from '../mock/useDemoData'
import { generateAnomalies, generateForecast } from '../mock/dataGenerator'

const AnomalyDot = (props) => {
  const { cx, cy, payload } = props
  if (!payload?.isAnomaly) return null
  return <circle cx={cx} cy={cy} r={8} fill="#ef4444" stroke="#fff" strokeWidth={2} />
}

export default function AnomalyDetection() {
  const { data: anomalies = [], loading: la, source } = useDemoData(
    () => getAnomalies(),
    (tick) => generateAnomalies(tick)
  )

  const { data: forecast = [], loading: lf } = useDemoData(
    () => getProbabilisticForecast(24),
    (tick) => generateForecast(24, tick)
  )

  const loading = la || lf

  // Build chart: p90 line + mark anomaly timestamps
  const forecastArr = Array.isArray(forecast) ? forecast : []

  const chartData = forecastArr.map(f => {
    const label = f.label ?? (() => {
      const d = new Date(f.timestamp)
      return `${String(d.getHours()).padStart(2, '0')}:00`
    })()
    const anom = (Array.isArray(anomalies) ? anomalies : []).find(a => {
      const aLabel = a.label ?? (() => {
        const d = new Date(a.timestamp)
        return `${String(d.getHours()).padStart(2, '0')}:00`
      })()
      return aLabel === label
    })
    return {
      label,
      p50: parseFloat((f.p50 ?? 0).toFixed(2)),
      p90: parseFloat((f.p90 ?? 0).toFixed(2)),
      threshold: parseFloat(((f.p90 ?? 0) * 1.2).toFixed(2)),
      actual: anom ? anom.actual : null,
      isAnomaly: !!anom,
    }
  })

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" /></div>

  const anomalyList = Array.isArray(anomalies) ? anomalies : []

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-text-primary mb-1">🔍 Anomaly Detection</h1>
          <p className="text-sm text-text-secondary">
            Unexpected charging spikes exceeding P90 × 1.2 safety threshold
            {source === 'mock' && <span className="ml-2 text-xs text-status-warning px-2 py-0.5 bg-status-warning/10 rounded-pill">Demo Mode</span>}
          </p>
        </div>
        {anomalyList.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-status-danger/10 text-status-danger rounded-pill text-xs font-semibold border border-status-danger/20">
            🚨 {anomalyList.length} Active Alert{anomalyList.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Anomalies Detected', val: anomalyList.length, color: anomalyList.length > 0 ? 'text-status-danger' : 'text-status-success' },
          { label: 'Detection Rule', val: 'P90 × 1.2', color: 'text-orange-400' },
          { label: 'System Status', val: anomalyList.length === 0 ? 'Normal' : 'Alert', color: anomalyList.length > 0 ? 'text-status-danger' : 'text-status-success' },
          { label: 'Monitored Slots', val: chartData.length, color: 'text-text-primary' },
        ].map(k => (
          <div key={k.label} className="bg-bg-card rounded-card p-4 hover-lift shadow-glass">
            <p className="text-xs text-text-muted mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-bg-card rounded-card p-5 shadow-glass mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Expected vs Safety Envelope</h3>
        <p className="text-xs text-text-muted mb-4">Red dots indicate actual load exceeded P90 × 1.2 anomaly threshold. Orange dashes = breach boundary.</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: '#A0A6B1', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} interval={Math.floor(chartData.length / 6)} />
            <YAxis tick={{ fill: '#A0A6B1', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} width={40} unit="kW" />
            <Tooltip contentStyle={{ background: '#1A1D21', border: '1px solid #2F343A', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="line" />
            <Line type="monotone" dataKey="threshold" stroke="#ef4444" strokeWidth={1} strokeDasharray="6 3" dot={false} name="Anomaly Threshold (P90×1.2)" />
            <Line type="monotone" dataKey="p90" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="P90 Upper Bound" />
            <Line type="monotone" dataKey="p50" stroke="#5B7CFA" strokeWidth={2.5} dot={<AnomalyDot />} activeDot={{ r: 5 }} name="P50 Expected Load" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Anomaly log */}
      <div className="bg-bg-card rounded-card p-5 shadow-glass">
        <h3 className="text-sm font-semibold text-text-primary mb-4">🚨 Live Anomaly Log</h3>
        {anomalyList.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-base font-semibold text-status-success mb-1">System Normal</p>
            <p className="text-sm text-text-secondary">No anomalies detected. All charging events within expected P90 bounds.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalyList.map((a, i) => (
              <div key={i} className="p-4 bg-status-danger/8 border border-status-danger/25 rounded-button">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-status-danger/20 text-status-danger rounded-pill font-semibold">ANOMALY #{i + 1}</span>
                      <p className="text-xs text-text-muted">{new Date(a.timestamp).toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-semibold text-status-danger">{a.reason}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-text-muted">Actual Load</p>
                    <p className="text-xl font-bold text-status-danger">{a.actual?.toFixed(1)} kW</p>
                    <p className="text-xs text-text-muted">Expected ≤ {a.expected_p90?.toFixed(1)} kW</p>
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
