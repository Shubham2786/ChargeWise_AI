import React from 'react'
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { LineChart } from 'recharts'
import { getDynamicPricing } from '../services/api'
import { useDemoData, useCountUp } from '../mock/useDemoData'
import { generatePricing, formatCurrency } from '../mock/dataGenerator'

export default function PricingIntelligence() {
  const { data: rawPricing, loading, source } = useDemoData(
    () => getDynamicPricing(),
    (tick) => generatePricing(tick)
  )

  const pricing = Array.isArray(rawPricing) ? rawPricing : []

  const chartData = pricing.map(p => {
    // Use pre-computed label if available, else derive 24h format from timestamp
    const label = p.label ?? (() => {
      const d = new Date(p.timestamp)
      return `${String(d.getHours()).padStart(2, '0')}:00`
    })()
    const inr = p.price_inr ?? p.price ?? 0
    const usd = p.price_usd ?? inr * 0.012
    return {
      label,
      inr: parseFloat(inr.toFixed(2)),
      usd: parseFloat((usd * 100).toFixed(3)),
      isPeak: inr > 11,
    }
  })

  const inrVals = chartData.map(d => d.inr)
  const avgINR = inrVals.length ? inrVals.reduce((a, b) => a + b, 0) / inrVals.length : 0
  const peakINR = inrVals.length ? Math.max(...inrVals) : 0
  const lowINR = inrVals.length ? Math.min(...inrVals) : 0
  const drEvents = chartData.filter(d => d.isPeak).length

  const avgAnimated = useCountUp(avgINR, 1000)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-text-primary mb-1">💰 Pricing Intelligence</h1>
          <p className="text-sm text-text-secondary">
            Dynamic electricity pricing reacting to real-time grid demand
            {source === 'mock' && <span className="ml-2 text-xs text-status-warning px-2 py-0.5 bg-status-warning/10 rounded-pill">Demo Mode</span>}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Avg Price (INR)', val: formatCurrency(avgAnimated, 'INR') + '/kWh', color: 'text-accent-primary' },
          { label: 'Peak Price (INR)', val: formatCurrency(peakINR, 'INR') + '/kWh', color: 'text-orange-400' },
          { label: 'Off-Peak (INR)', val: formatCurrency(lowINR, 'INR') + '/kWh', color: 'text-status-success' },
          { label: 'DR Events', val: drEvents, color: 'text-status-warning' },
        ].map(k => (
          <div key={k.label} className="glass-dark rounded-card p-4 hover-lift">
            <p className="text-xs text-text-muted mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Main price chart */}
      <div className="bg-bg-card rounded-card p-5 shadow-glass mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-1">₹ per kWh — Dynamic Price Curve</h3>
        <p className="text-xs text-text-muted mb-4">Price spikes correspond to demand peaks. Charge during off-peak windows to reduce cost by up to 45%.</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: '#A0A6B1', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} interval={Math.floor(chartData.length / 6)} />
            <YAxis tick={{ fill: '#A0A6B1', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} width={45} unit="₹" />
            <Tooltip
              contentStyle={{ background: '#1A1D21', border: '1px solid #2F343A', borderRadius: 8, fontSize: 12 }}
              formatter={(v, name) => [`₹${v}/kWh`, name]}
            />
            <ReferenceLine y={avgINR} stroke="#5B7CFA" strokeDasharray="5 5"
              label={{ value: 'Avg', fill: '#5B7CFA', fontSize: 10, position: 'insideTopRight' }} />
            <Line type="monotone" dataKey="inr" stroke="#f97316" strokeWidth={2.5} dot={false} name="₹ Price/kWh" activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* USD reference row */}
      <div className="glass-dark rounded-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">$ USD Equivalent Reference (next 6 hours)</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {chartData.slice(0, 6).map((d, i) => (
            <div key={i} className={`p-3 rounded-button text-center ${d.isPeak ? 'bg-orange-400/10 border border-orange-400/20' : 'bg-bg-elevated'}`}>
              <p className="text-xs text-text-muted">{d.label}</p>
              <p className={`text-sm font-bold mt-1 ${d.isPeak ? 'text-orange-400' : 'text-text-primary'}`}>
                {formatCurrency(d.inr, 'INR')}
              </p>
              <p className="text-xs text-text-muted mt-0.5">{formatCurrency(d.usd / 100, 'USD')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* DR Events table */}
      <div className="bg-bg-card rounded-card p-5 shadow-glass">
        <h3 className="text-sm font-semibold text-text-primary mb-4">⚡ Demand Response Events — Curtailment Opportunities</h3>
        <div className="space-y-2">
          {chartData.filter(d => d.isPeak).slice(0, 5).map((d, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-bg-elevated rounded-button">
              <div className="flex items-center gap-3">
                <span className="text-orange-400 text-lg">⚡</span>
                <div>
                  <p className="text-sm font-medium text-text-primary">{d.label} — High Demand Window</p>
                  <p className="text-xs text-text-muted">Shift EV charging to save {formatCurrency((d.inr - lowINR).toFixed(2), 'INR')}/kWh</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-base font-bold text-orange-400">{formatCurrency(d.inr, 'INR')}/kWh</p>
                <p className="text-xs text-text-muted">{formatCurrency(d.usd / 100, 'USD')}/kWh</p>
              </div>
            </div>
          ))}
          {chartData.filter(d => d.isPeak).length === 0 && (
            <p className="text-sm text-text-muted text-center py-6">No DR events active — all prices within off-peak range.</p>
          )}
        </div>
      </div>
    </div>
  )
}
