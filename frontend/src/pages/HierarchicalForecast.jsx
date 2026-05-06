import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getHierarchicalForecast } from '../services/api'

export default function HierarchicalForecast() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHierarchicalForecast().then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" /></div>

  const system = (data?.system_forecast ?? []).slice(0, 24).map((f, i) => ({
    label: `H+${i + 1}`,
    p50: parseFloat(f.p50.toFixed(2)),
    p90: parseFloat(f.p90.toFixed(2)),
    fallback: f.fallback_active ? f.p50 : null
  }))

  const stationIds = Object.keys(data?.station_forecasts ?? {})
  const consistency = stationIds.length > 0
    ? system.map((s, i) => {
        const stationSum = stationIds.reduce((acc, st) => acc + ((data.station_forecasts[st][i]?.p50) ?? 0), 0)
        return { label: s.label, systemP50: s.p50, stationSum: parseFloat(stationSum.toFixed(2)) }
      })
    : []

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
      <div className="mb-6">
        <h1 className="text-h1 text-text-primary mb-1">🌐 Hierarchical Forecasting</h1>
        <p className="text-sm text-text-secondary">Station → System aggregation with global fallback validation</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Stations Tracked', val: stationIds.length },
          { label: 'Fallback Hours', val: system.filter(s => s.fallback !== null).length },
          { label: 'Horizon', val: `${system.length}h` },
          { label: 'Max System P90', val: `${Math.max(...system.map(s=>s.p90), 0).toFixed(1)} kWh` },
        ].map(k => (
          <div key={k.label} className="bg-bg-card rounded-card p-4 hover-lift shadow-glass">
            <p className="text-xs text-text-muted mb-1">{k.label}</p>
            <p className="text-2xl font-bold text-text-primary">{k.val}</p>
          </div>
        ))}
      </div>

      {/* Hierarchy Flow */}
      <div className="glass-dark rounded-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Aggregation Architecture</h3>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {stationIds.slice(0, 5).map((st, i) => (
            <React.Fragment key={st}>
              <div className="bg-bg-elevated px-3 py-2 rounded-button text-center">
                <p className="text-xs text-text-muted">Station</p>
                <p className="text-sm font-bold text-accent-primary truncate max-w-[80px]">{st.slice(0,8)}</p>
              </div>
              {i < stationIds.slice(0,5).length - 1 && <span className="text-text-muted">+</span>}
            </React.Fragment>
          ))}
          {stationIds.length > 5 && <span className="text-text-muted text-sm">+{stationIds.length - 5} more</span>}
          <span className="text-2xl text-text-muted">→</span>
          <div className="bg-gradient-primary px-4 py-2 rounded-button text-center shadow-glass">
            <p className="text-xs text-white/70">System</p>
            <p className="text-sm font-bold text-white">Total Grid</p>
          </div>
        </div>
      </div>

      {/* System Forecast Chart */}
      <div className="bg-bg-card rounded-card p-5 shadow-glass mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">System-Level Forecast (P50 / P90)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={system} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: '#A0A6B1', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} interval={3} />
            <YAxis tick={{ fill: '#A0A6B1', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} width={40} />
            <Tooltip contentStyle={{ background: '#1A1D21', border: '1px solid #2F343A', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Bar dataKey="p50" fill="#5B7CFA" fillOpacity={0.8} name="P50 Median" radius={[2,2,0,0]} />
            <Bar dataKey="p90" fill="#f97316" fillOpacity={0.5} name="P90 Upper" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Consistency Check */}
      {consistency.length > 0 && (
        <div className="bg-bg-card rounded-card p-5 shadow-glass">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Aggregation Consistency</h3>
          <p className="text-xs text-text-muted mb-4">Station sum vs system model — divergence triggers global fallback</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={consistency.slice(0,12)} margin={{ top:5,right:10,left:-20,bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: '#A0A6B1', fontSize: 9 }} axisLine={{ stroke: '#2F343A' }} />
              <YAxis tick={{ fill: '#A0A6B1', fontSize: 9 }} width={30} />
              <Tooltip contentStyle={{ background: '#1A1D21', border: '1px solid #2F343A', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="systemP50" fill="#5B7CFA" name="System Model" radius={[2,2,0,0]} />
              <Bar dataKey="stationSum" fill="#22c55e" fillOpacity={0.6} name="Station Sum" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
