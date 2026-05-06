import React, { useState, useEffect } from 'react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { getDynamicPricing, getProbabilisticForecast } from '../services/api'

export default function PricingIntelligence() {
  const [chartData, setChartData] = useState([])
  const [stats, setStats] = useState({ avg: 0, peak: 0, low: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [priceRes, forecastRes] = await Promise.all([getDynamicPricing(), getProbabilisticForecast(24)])
        const prices = priceRes.data
        const forecast = forecastRes.data
        const merged = prices.map((p, i) => {
          const d = new Date(p.timestamp)
          const f = forecast[i]
          return {
            label: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            price: parseFloat((p.price * 100).toFixed(3)),
            load: f ? parseFloat(f.p50.toFixed(2)) : 0,
            isPeak: p.price > 0.2,
          }
        })
        setChartData(merged)
        const vals = merged.map(d => d.price)
        setStats({ avg: (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2), peak: Math.max(...vals).toFixed(2), low: Math.min(...vals).toFixed(2) })
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
      <div className="mb-6">
        <h1 className="text-h1 text-text-primary mb-1">💰 Pricing Intelligence</h1>
        <p className="text-sm text-text-secondary">Dynamic electricity pricing based on real-time grid demand</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Avg Price', val: `${stats.avg}¢`, color: 'text-accent-primary' },
          { label: 'Peak Price', val: `${stats.peak}¢`, color: 'text-orange-400' },
          { label: 'Low Price', val: `${stats.low}¢`, color: 'text-status-success' },
          { label: 'DR Events', val: chartData.filter(d=>d.isPeak).length, color: 'text-status-warning' },
        ].map(k => (
          <div key={k.label} className="glass-dark rounded-card p-4 hover-lift">
            <p className="text-xs text-text-muted mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>
      <div className="bg-bg-card rounded-card p-5 shadow-glass mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Load vs Dynamic Price Overlay</h3>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: '#A0A6B1', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} interval={Math.floor(chartData.length/6)} />
            <YAxis yAxisId="load" tick={{ fill: '#5B7CFA', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} width={40} />
            <YAxis yAxisId="price" orientation="right" tick={{ fill: '#f97316', fontSize: 10 }} axisLine={{ stroke: '#2F343A' }} />
            <Tooltip contentStyle={{ background: '#1A1D21', border: '1px solid #2F343A', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Bar yAxisId="load" dataKey="load" fill="#5B7CFA" fillOpacity={0.25} name="P50 Load (kWh)" radius={[2,2,0,0]} />
            <Line yAxisId="price" type="monotone" dataKey="price" stroke="#f97316" strokeWidth={2.5} dot={false} name="Price (¢/kWh)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-bg-card rounded-card p-5 shadow-glass">
        <h3 className="text-sm font-semibold text-text-primary mb-4">⚡ Demand Response Events</h3>
        <div className="space-y-2">
          {chartData.filter(d=>d.isPeak).slice(0,5).map((d,i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-bg-elevated rounded-button">
              <span className="text-xs text-text-muted">{d.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary">{d.load} kWh</span>
                <span className="text-sm font-bold text-orange-400">{d.price}¢/kWh</span>
                <span className="text-xs px-2 py-0.5 bg-orange-400/20 text-orange-400 rounded-pill">DR EVENT</span>
              </div>
            </div>
          ))}
          {chartData.filter(d=>d.isPeak).length === 0 && <p className="text-sm text-text-muted text-center py-4">No DR events in this window.</p>}
        </div>
      </div>
    </div>
  )
}
