import React from 'react'
import { getDashboardSummary } from '../services/api'
import { useDemoData, useCountUp } from '../mock/useDemoData'
import { generateDashboardSummary, formatCurrency, GRID_CAPACITY_KW } from '../mock/dataGenerator'

const RISK_CONFIG = {
  LOW: { color: '#22c55e', bg: 'bg-status-success/10', text: 'text-status-success', icon: '✅' },
  MEDIUM: { color: '#f59e0b', bg: 'bg-status-warning/10', text: 'text-status-warning', icon: '⚠️' },
  HIGH: { color: '#ef4444', bg: 'bg-status-danger/10', text: 'text-status-danger', icon: '🚨' },
}

export default function SystemOverview() {
  const { data: summary, loading, source } = useDemoData(
    () => getDashboardSummary(),
    (tick) => generateDashboardSummary(tick)
  )

  const risk = summary?.risk ?? {}
  const riskCfg = RISK_CONFIG[risk.risk_level ?? 'LOW']
  const forecast = summary?.forecast ?? []
  const sched = summary?.schedule ?? {}
  const pricing = summary?.pricing ?? []
  const anomalies = summary?.anomalies ?? []
  const candidates = summary?.planning_candidates ?? []

  const avgP50 = forecast.length
    ? (forecast.reduce((a, b) => a + (b.p50 ?? 0), 0) / forecast.length)
    : 0
  const avgINR = pricing.length
    ? (pricing.reduce((a, b) => a + (b.price_inr ?? b.price ?? 0), 0) / pricing.length)
    : 0
  const peakRed = sched?.peak_reduction_percent ?? 0

  const avgP50Animated = useCountUp(avgP50, 1000)
  const avgINRAnimated = useCountUp(avgINR, 1200)
  const peakRedAnimated = useCountUp(peakRed, 1400)

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-text-secondary animate-pulse">Loading unified intelligence...</p>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-text-primary mb-1">🌐 System Overview</h1>
          <p className="text-sm text-text-secondary">
            Unified grid intelligence — all 10 features in one view
            {source === 'mock' && <span className="ml-2 text-xs text-status-warning px-2 py-0.5 bg-status-warning/10 rounded-pill">Demo Mode</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
          <span className="text-xs text-text-muted">Live Intelligence Active</span>
        </div>
      </div>

      {/* Master KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Avg. Demand (P50)', val: `${avgP50Animated.toFixed(1)} kWh`, icon: '⚡', color: 'text-accent-primary' },
          { label: 'Grid Risk Level', val: risk.risk_level ?? 'LOW', icon: riskCfg.icon, color: riskCfg.text },
          { label: 'Peak Reduction', val: `${peakRedAnimated.toFixed(1)}%`, icon: '📉', color: 'text-status-success' },
          { label: 'Avg Price', val: formatCurrency(avgINRAnimated, 'INR') + '/kWh', icon: '💰', color: 'text-orange-400' },
        ].map(k => (
          <div key={k.label} className="glass-dark rounded-card p-4 hover-lift">
            <p className="text-xs text-text-muted mb-1">{k.icon} {k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* 3-panel row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Risk */}
        <div className={`rounded-card p-5 ${riskCfg.bg} border border-white/10`}>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">🛡️ Grid Risk</h3>
          <p className={`text-4xl font-bold ${riskCfg.text}`}>{risk.risk_level ?? 'LOW'}</p>
          <p className={`text-sm ${riskCfg.text} mt-1 opacity-80`}>
            Overload probability: {((risk.probability ?? 0) * 100).toFixed(1)}%
          </p>
          <div className="mt-3 h-2 bg-bg-card/50 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${(risk.probability ?? 0) * 100}%`, background: riskCfg.color }} />
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-bg-card rounded-card p-5 shadow-glass">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">📅 Smart Scheduling</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Uncontrolled Peak</span>
              <span className="text-sm font-bold text-status-danger">{(sched.uncontrolled_peak ?? 0).toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Optimised Peak</span>
              <span className="text-sm font-bold text-status-success">{(sched.optimized_peak ?? 0).toFixed(1)} kW</span>
            </div>
            <div className="h-px bg-border-subtle my-1" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">EDF Reduction</span>
              <span className="text-base font-bold text-accent-primary">{peakRed.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Anomalies */}
        <div className={`rounded-card p-5 shadow-glass ${anomalies.length > 0 ? 'bg-status-danger/8 border border-status-danger/25' : 'bg-bg-card'}`}>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">🔍 Anomaly Status</h3>
          {anomalies.length === 0 ? (
            <div>
              <p className="text-4xl font-bold text-status-success">0</p>
              <p className="text-sm text-status-success mt-1">All clear — no spikes detected</p>
            </div>
          ) : (
            <div>
              <p className="text-4xl font-bold text-status-danger">{anomalies.length}</p>
              <p className="text-sm text-status-danger mt-1">Spike{anomalies.length > 1 ? 's' : ''} detected</p>
              <p className="text-xs text-text-muted mt-2 line-clamp-2">{anomalies[0]?.reason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Planning candidates */}
      {candidates.length > 0 && (
        <div className="bg-bg-card rounded-card p-5 shadow-glass mb-4">
          <h3 className="text-sm font-semibold text-text-primary mb-4">📍 Top Infrastructure Candidates</h3>
          <div className="space-y-2">
            {candidates.slice(0, 3).map((c, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-bg-elevated rounded-button">
                <div className="w-7 h-7 rounded-full bg-gradient-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{c.zone_name ?? 'Zone'}</p>
                  <p className="text-xs text-text-muted truncate">{c.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-text-muted mb-1">Score</p>
                  <p className="text-sm font-bold text-accent-primary">{c.score_pct ?? Math.round(c.score * 100)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing preview */}
      <div className="bg-bg-card rounded-card p-5 shadow-glass">
        <h3 className="text-sm font-semibold text-text-primary mb-4">💰 Price Forecast — Next 6 Hours</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {pricing.slice(0, 6).map((p, i) => {
            const inr = p.price_inr ?? p.price ?? 0
            const isHigh = inr > 11
            const label = p.label ?? (() => {
              const d = new Date(p.timestamp)
              return `${String(d.getHours()).padStart(2, '0')}:00`
            })()
            return (
              <div key={i} className={`p-3 rounded-button text-center ${isHigh ? 'bg-orange-400/10 border border-orange-400/25' : 'bg-bg-elevated'}`}>
                <p className="text-xs text-text-muted">{label}</p>
                <p className={`text-sm font-bold mt-1 ${isHigh ? 'text-orange-400' : 'text-text-primary'}`}>
                  {formatCurrency(inr, 'INR')}
                </p>
                <p className="text-xs text-text-muted">{formatCurrency(inr * 0.012, 'USD')}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
