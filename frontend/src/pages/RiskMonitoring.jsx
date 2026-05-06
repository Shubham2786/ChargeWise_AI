import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getGridRisk } from '../services/api'
import { useDemoData, useCountUp } from '../mock/useDemoData'
import { generateRisk } from '../mock/dataGenerator'

const RISK_CONFIG = {
  LOW: { color: '#22c55e', bg: 'bg-status-success/10', text: 'text-status-success', label: 'System Healthy', icon: '✅', bar: '#22c55e' },
  MEDIUM: { color: '#f59e0b', bg: 'bg-status-warning/10', text: 'text-status-warning', label: 'Moderate Risk', icon: '⚠️', bar: '#f59e0b' },
  HIGH: { color: '#ef4444', bg: 'bg-status-danger/10', text: 'text-status-danger', label: 'Critical Risk', icon: '🚨', bar: '#ef4444' },
}

export default function RiskMonitoring() {
  const { data, loading, source } = useDemoData(
    () => getGridRisk(),
    (tick) => generateRisk(tick)
  )

  const level = data?.risk_level ?? 'LOW'
  const cfg = RISK_CONFIG[level]
  const prob = ((data?.probability ?? 0.05) * 100)
  const probAnimated = useCountUp(prob, 1200)
  const stress = Math.min(100, prob * 1.15).toFixed(0)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" /></div>

  const timeline = (data?.details ?? []).slice(0, 24).map((d, i) => ({
    hour: `H+${i + 1}`,
    risk: d.risk === 'HIGH' ? 3 : d.risk === 'MEDIUM' ? 2 : 1,
    label: d.risk,
  }))

  const alertCount = timeline.filter(d => d.risk > 1).length
  const safeCount = timeline.filter(d => d.risk === 1).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-text-primary mb-1">🛡️ Risk Monitoring</h1>
          <p className="text-sm text-text-secondary">
            Grid overload probability and transformer stress analysis
            {source === 'mock' && <span className="ml-2 text-xs text-status-warning px-2 py-0.5 bg-status-warning/10 rounded-pill">Demo Mode</span>}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-pill text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
          <span>{cfg.icon}</span> {level} RISK
        </div>
      </div>

      {/* Risk Hero */}
      <div className={`rounded-card p-6 sm:p-8 mb-6 ${cfg.bg} border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-6`}>
        <div className="text-6xl">{cfg.icon}</div>
        <div className="flex-1">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Current Risk Assessment</p>
          <p className={`text-5xl font-bold ${cfg.text}`}>{level}</p>
          <p className={`text-sm ${cfg.text} mt-1 opacity-80`}>{cfg.label} — {alertCount} high-risk windows detected in next 24h</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40 mb-1">Overload Probability</p>
          <p className={`text-5xl font-bold ${cfg.text}`}>{probAnimated.toFixed(1)}%</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Overload Prob.', val: `${prob.toFixed(1)}%`, icon: '⚡' },
          { label: 'Transformer Stress', val: `${stress}%`, icon: '🔌' },
          { label: 'Risk Alerts (24h)', val: alertCount, icon: '🔔' },
          { label: 'Safe Windows', val: safeCount, icon: '🟢' },
        ].map(k => (
          <div key={k.label} className="bg-bg-card rounded-card p-4 hover-lift shadow-glass">
            <p className="text-xs text-text-muted mb-1">{k.icon} {k.label}</p>
            <p className="text-2xl font-bold text-text-primary">{k.val}</p>
          </div>
        ))}
      </div>

      {/* Transformer stress bar */}
      <div className="bg-bg-card rounded-card p-5 shadow-glass mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">⚙️ Transformer Stress Indicator</h3>
        <div className="relative h-4 bg-bg-elevated rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${stress}%`, background: `linear-gradient(90deg, #22c55e 0%, #f59e0b 55%, #ef4444 100%)` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <span className="text-status-success">Safe (0%)</span>
          <span className="text-text-muted font-semibold">{stress}% Current Load</span>
          <span className="text-status-danger">Critical (100%)</span>
        </div>
      </div>

      {/* Timeline chart */}
      <div className="bg-bg-card rounded-card p-5 shadow-glass">
        <h3 className="text-sm font-semibold text-text-primary mb-4">📅 24-Hour Risk Timeline</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={timeline} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="hour" tick={{ fill: '#A0A6B1', fontSize: 9 }} axisLine={{ stroke: '#2F343A' }} interval={3} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: '#1A1D21', border: '1px solid #2F343A', borderRadius: 8, fontSize: 12 }}
              formatter={(_, __, props) => [props.payload.label, 'Risk Level']}
            />
            <Bar dataKey="risk" radius={[3, 3, 0, 0]}>
              {timeline.map((e, i) => (
                <Cell key={i} fill={e.risk === 3 ? '#ef4444' : e.risk === 2 ? '#f59e0b' : '#22c55e'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-5 mt-3 justify-center">
          {[['#22c55e', 'LOW'], ['#f59e0b', 'MEDIUM'], ['#ef4444', 'HIGH']].map(([c, l]) => (
            <span key={l} className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-3 h-3 rounded-sm" style={{ background: c }} />{l}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
