import React, { useState, useEffect } from 'react'
import { getDashboardSummary } from '../services/api'

const RISK_CONFIG = {
  LOW:    { color: '#22c55e', bg: 'bg-status-success/10', text: 'text-status-success', icon: '✅' },
  MEDIUM: { color: '#f59e0b', bg: 'bg-status-warning/10', text: 'text-status-warning', icon: '⚠️' },
  HIGH:   { color: '#ef4444', bg: 'bg-status-danger/10',  text: 'text-status-danger',  icon: '🚨' },
}

export default function SystemOverview() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardSummary()
      .then(r => { setSummary(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-text-secondary">Loading system intelligence...</p>
    </div>
  )

  if (!summary) return (
    <div className="p-8 text-center text-status-danger">
      Failed to load system overview. Ensure backend is running.
    </div>
  )

  const risk = summary.risk ?? {}
  const riskCfg = RISK_CONFIG[risk.risk_level ?? 'LOW']
  const forecast = summary.forecast ?? []
  const schedule = summary.schedule ?? {}
  const pricing = summary.pricing ?? []
  const anomalies = summary.anomalies ?? []
  const candidates = summary.planning_candidates ?? []

  const avgP50 = forecast.length ? (forecast.reduce((a,b) => a + b.p50, 0) / forecast.length).toFixed(1) : '--'
  const avgPrice = pricing.length ? ((pricing.reduce((a,b) => a + b.price, 0) / pricing.length) * 100).toFixed(2) : '--'
  const peakReduction = schedule.peak_reduction_percent?.toFixed(1) ?? '--'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
      <div className="mb-6">
        <h1 className="text-h1 text-text-primary mb-1">🌐 System Overview</h1>
        <p className="text-sm text-text-secondary">Unified grid intelligence — all 10 features in one view</p>
      </div>

      {/* Master KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Avg. Demand (P50)', val: `${avgP50} kWh`, icon: '⚡', color: 'text-accent-primary' },
          { label: 'Grid Risk', val: risk.risk_level ?? 'LOW', icon: riskCfg.icon, color: riskCfg.text },
          { label: 'Peak Reduction', val: `${peakReduction}%`, icon: '📉', color: 'text-status-success' },
          { label: 'Avg Price', val: `${avgPrice}¢/kWh`, icon: '💰', color: 'text-orange-400' },
        ].map(k => (
          <div key={k.label} className="glass-dark rounded-card p-4 hover-lift">
            <p className="text-xs text-text-muted mb-1">{k.icon} {k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Risk Panel */}
        <div className={`rounded-card p-5 ${riskCfg.bg} border border-white/10`}>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">🛡️ Grid Risk</h3>
          <p className={`text-3xl font-bold ${riskCfg.text}`}>{risk.risk_level ?? 'LOW'}</p>
          <p className={`text-sm ${riskCfg.text} mt-1`}>Probability: {((risk.probability ?? 0) * 100).toFixed(1)}%</p>
          <div className="mt-3 h-2 bg-bg-card rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(risk.probability ?? 0) * 100}%`, background: riskCfg.color }} />
          </div>
        </div>

        {/* Scheduling Panel */}
        <div className="bg-bg-card rounded-card p-5 shadow-glass">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">📅 Smart Schedule</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-text-muted">Uncontrolled Peak</span>
              <span className="text-sm font-bold text-status-danger">{schedule.uncontrolled_peak?.toFixed(1) ?? '--'} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-text-muted">Optimized Peak</span>
              <span className="text-sm font-bold text-status-success">{schedule.optimized_peak?.toFixed(1) ?? '--'} kW</span>
            </div>
            <div className="flex justify-between border-t border-border-subtle pt-2 mt-2">
              <span className="text-xs text-text-muted">Reduction</span>
              <span className="text-base font-bold text-accent-primary">{peakReduction}%</span>
            </div>
          </div>
        </div>

        {/* Anomalies Panel */}
        <div className={`rounded-card p-5 shadow-glass ${anomalies.length > 0 ? 'bg-status-danger/10 border border-status-danger/20' : 'bg-bg-card'}`}>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">🔍 Anomalies</h3>
          {anomalies.length === 0 ? (
            <div>
              <p className="text-3xl font-bold text-status-success">0</p>
              <p className="text-sm text-status-success mt-1">All clear — no spikes detected</p>
            </div>
          ) : (
            <div>
              <p className="text-3xl font-bold text-status-danger">{anomalies.length}</p>
              <p className="text-sm text-status-danger mt-1">Spike anomalies detected</p>
              <p className="text-xs text-text-muted mt-2">{anomalies[0]?.reason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Planning Candidates */}
      {candidates.length > 0 && (
        <div className="bg-bg-card rounded-card p-5 shadow-glass mb-4">
          <h3 className="text-sm font-semibold text-text-primary mb-4">📍 Top Siting Candidates</h3>
          <div className="space-y-2">
            {candidates.slice(0, 3).map((c, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-bg-elevated rounded-button">
                <div className="w-7 h-7 rounded-full bg-gradient-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-muted">{c.location}</p>
                  <p className="text-sm text-text-primary">{c.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-text-muted mb-1">Score</p>
                  <div className="w-16 h-2 bg-bg-card rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${(c.score * 100).toFixed(0)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Summary */}
      <div className="bg-bg-card rounded-card p-5 shadow-glass">
        <h3 className="text-sm font-semibold text-text-primary mb-4">💰 Price Forecast (next 6h)</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {pricing.slice(0, 6).map((p, i) => {
            const price = (p.price * 100).toFixed(2)
            const isHigh = p.price > 0.2
            return (
              <div key={i} className={`p-3 rounded-button text-center ${isHigh ? 'bg-orange-400/10 border border-orange-400/20' : 'bg-bg-elevated'}`}>
                <p className="text-xs text-text-muted">{new Date(p.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>
                <p className={`text-sm font-bold mt-1 ${isHigh ? 'text-orange-400' : 'text-text-primary'}`}>{price}¢</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
