import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getHierarchicalForecast } from '../services/api'
import { useDemoData } from '../mock/useDemoData'
import { generateHierarchy } from '../mock/dataGenerator'

export default function HierarchicalForecast() {
  const { data, loading, source } = useDemoData(
    () => getHierarchicalForecast(),
    (tick) => generateHierarchy(tick)
  )

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" /></div>

  const system    = (data?.system_forecast ?? []).slice(0, 24).map((f, i) => ({
    label:    `H+${i + 1}`,
    p50:      parseFloat((f.p50 ?? 0).toFixed(2)),
    p90:      parseFloat((f.p90 ?? 0).toFixed(2)),
    fallback: f.fallback_active,
  }))

  const stationIds    = Object.keys(data?.station_forecasts ?? {})
  const maxSystemP90  = Math.max(...system.map(s => s.p90), 0)
  const fallbackHours = system.filter(s => s.fallback).length

  const consistency = stationIds.length > 0
    ? system.slice(0, 12).map((s, i) => {
        const stationSum = stationIds.reduce((acc, st) => {
          return acc + ((data.station_forecasts[st][i]?.p50) ?? 0)
        }, 0)
        return {
          label:      s.label,
          systemP50:  s.p50,
          stationSum: parseFloat(stationSum.toFixed(2)),
        }
      })
    : []

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
      <div className="mb-6">
        <h1 className="text-h1 text-text-primary mb-1">🌐 Hierarchical Forecasting</h1>
        <p className="text-sm text-text-secondary">
          Station → Zone → System aggregation with global fallback validation
          {source === 'mock' && <span className="ml-2 text-xs text-status-warning px-2 py-0.5 bg-status-warning/10 rounded-pill">Demo Mode</span>}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Stations Tracked',  val: stationIds.length },
          { label: 'Fallback Hours',    val: fallbackHours },
          { label: 'Horizon',           val: `${system.length}h` },
          { label: 'Max System P90',    val: `${maxSystemP90.toFixed(1)} kWh` },
        ].map(k => (
          <div key={k.label} className="bg-bg-card rounded-card p-4 hover-lift shadow-glass">
            <p className="text-xs text-text-muted mb-1">{k.label}</p>
            <p className="text-2xl font-bold text-text-primary">{k.val}</p>
          </div>
        ))}
      </div>

      {/* Hierarchy flow */}
      <div className="glass-dark rounded-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Aggregation Architecture</h3>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {stationIds.map((st, i) => (
            <React.Fragment key={st}>
              <div className="bg-bg-elevated px-3 py-2 rounded-button text-center border border-border-subtle">
                <p className="text-xs text-text-muted">Station</p>
                <p className="text-sm font-bold text-accent-primary">{st}</p>
                <p className="text-xs text-text-muted mt-0.5">{(data.station_forecasts[st][0]?.p50 ?? 0).toFixed(1)} kWh</p>
              </div>
              {i < stationIds.length - 1 && <span className="text-text-muted text-lg">+</span>}
            </React.Fragment>
          ))}
          <span className="text-2xl text-text-muted mx-2">→</span>
          <div className="bg-gradient-to-br from-blue-600/30 to-indigo-600/20 px-5 py-3 rounded-button text-center border border-blue-500/30 shadow-glass">
            <p className="text-xs text-white/60">System Total</p>
            <p className="text-base font-bold text-white">{(system[0]?.p50 ?? 0).toFixed(1)} kWh</p>
            <p className="text-xs text-white/40 mt-0.5">@ H+1</p>
          </div>
        </div>
        {fallbackHours > 0 && (
          <div className="mt-4 p-3 bg-status-warning/10 border border-status-warning/20 rounded-button text-xs text-status-warning">
            ⚠️ Global fallback active for {fallbackHours} hours — station sum diverged &gt;20% from global model
          </div>
        )}
      </div>

      {/* System chart */}
      <div className="bg-bg-card rounded-card p-5 shadow-glass mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">System-Level Forecast (P50 / P90)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={system} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: '#A0A6B1', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} interval={3} />
            <YAxis tick={{ fill: '#A0A6B1', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} width={40} unit="kWh" />
            <Tooltip contentStyle={{ background: '#1A1D21', border: '1px solid #2F343A', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Bar dataKey="p50" fill="#5B7CFA" fillOpacity={0.85} name="P50 Median" radius={[2, 2, 0, 0]} />
            <Bar dataKey="p90" fill="#f97316" fillOpacity={0.45} name="P90 Upper"  radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Consistency check */}
      {consistency.length > 0 && (
        <div className="bg-bg-card rounded-card p-5 shadow-glass">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Aggregation Consistency Check</h3>
          <p className="text-xs text-text-muted mb-4">Station sum vs system model — divergence &gt;20% triggers global fallback to ensure accuracy.</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={consistency} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: '#A0A6B1', fontSize: 9 }} axisLine={{ stroke: '#2F343A' }} />
              <YAxis tick={{ fill: '#A0A6B1', fontSize: 9 }} width={30} />
              <Tooltip contentStyle={{ background: '#1A1D21', border: '1px solid #2F343A', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="systemP50"  fill="#5B7CFA" name="System Model (Global)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="stationSum" fill="#22c55e" fillOpacity={0.65} name="Station Sum (Bottom-Up)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
