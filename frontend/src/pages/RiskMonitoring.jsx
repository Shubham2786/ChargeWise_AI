import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getGridRisk } from '../services/api'

const RISK_CONFIG = {
  LOW:    { color: '#22c55e', bg: 'bg-status-success/10', text: 'text-status-success', label: 'System Healthy', icon: '✅' },
  MEDIUM: { color: '#f59e0b', bg: 'bg-status-warning/10', text: 'text-status-warning', label: 'Moderate Risk', icon: '⚠️' },
  HIGH:   { color: '#ef4444', bg: 'bg-status-danger/10',  text: 'text-status-danger',  label: 'Critical Risk',  icon: '🚨' },
}

export default function RiskMonitoring() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGridRisk().then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" /></div>

  const level = data?.risk_level ?? 'LOW'
  const cfg = RISK_CONFIG[level]
  const prob = ((data?.probability ?? 0) * 100).toFixed(1)
  const stress = Math.min(100, parseFloat(prob) * 1.2).toFixed(0)

  // Build timeline bar chart from details
  const timeline = (data?.details ?? []).slice(0, 24).map((d, i) => ({
    hour: `H+${i + 1}`,
    risk: d.risk === 'HIGH' ? 3 : d.risk === 'MEDIUM' ? 2 : 1,
    label: d.risk
  }))

  const barColor = (val) => val === 3 ? '#ef4444' : val === 2 ? '#f59e0b' : '#22c55e'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
      <div className="mb-6">
        <h1 className="text-h1 text-text-primary mb-1">🛡️ Risk Monitoring</h1>
        <p className="text-sm text-text-secondary">Grid overload probability and transformer stress analysis</p>
      </div>

      {/* Risk Level Hero */}
      <div className={`rounded-card p-6 sm:p-8 mb-6 ${cfg.bg} border border-current/10 flex flex-col sm:flex-row items-start sm:items-center gap-4`}>
        <div className="text-5xl">{cfg.icon}</div>
        <div className="flex-1">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Current Risk Level</p>
          <p className={`text-4xl font-bold ${cfg.text}`}>{level}</p>
          <p className={`text-sm ${cfg.text} mt-1`}>{cfg.label}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted mb-1">Overload Probability</p>
          <p className={`text-5xl font-bold ${cfg.text}`}>{prob}%</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Overload Prob.', val: `${prob}%`, icon: '⚡' },
          { label: 'Transformer Stress', val: `${stress}%`, icon: '🔌' },
          { label: 'Alerts (24h)', val: timeline.filter(d => d.risk > 1).length, icon: '🔔' },
          { label: 'Safe Windows', val: timeline.filter(d => d.risk === 1).length, icon: '🟢' },
        ].map(k => (
          <div key={k.label} className="bg-bg-card rounded-card p-4 hover-lift shadow-glass">
            <p className="text-xs text-text-muted mb-1">{k.icon} {k.label}</p>
            <p className="text-2xl font-bold text-text-primary">{k.val}</p>
          </div>
        ))}
      </div>

      {/* Transformer Stress Gauge */}
      <div className="bg-bg-card rounded-card p-5 shadow-glass mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">⚙️ Transformer Stress Indicator</h3>
        <div className="relative h-4 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${stress}%`, background: `linear-gradient(90deg, #22c55e, #f59e0b ${stress > 60 ? '60%' : '100%'}, #ef4444)` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-status-success">Safe (0%)</span>
          <span className="text-xs text-text-muted">{stress}% Load</span>
          <span className="text-xs text-status-danger">Critical (100%)</span>
        </div>
      </div>

      {/* Alerts Timeline */}
      {timeline.length > 0 && (
        <div className="bg-bg-card rounded-card p-5 shadow-glass">
          <h3 className="text-sm font-semibold text-text-primary mb-4">📅 24-Hour Risk Timeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timeline} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fill: '#A0A6B1', fontSize: 9 }} axisLine={{ stroke: '#2F343A' }} interval={3} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#1A1D21', border: '1px solid #2F343A', borderRadius: 8, fontSize: 12 }}
                formatter={(val, _, props) => [props.payload.label, 'Risk']}
              />
              <Bar dataKey="risk" radius={[3, 3, 0, 0]}>
                {timeline.map((entry, i) => <Cell key={i} fill={barColor(entry.risk)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 justify-center">
            {[['#22c55e','LOW'],['#f59e0b','MEDIUM'],['#ef4444','HIGH']].map(([c,l]) => (
              <span key={l} className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className="w-3 h-3 rounded-sm" style={{ background: c }} />{l}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
