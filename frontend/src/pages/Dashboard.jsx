import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { generateData, getForecast, getRisk, getExplain } from '../services/api'
import MetricCard from '../components/MetricCard'
import ChartCard from '../components/ChartCard'

function Dashboard() {
  const [forecast, setForecast] = useState(null)
  const [risk, setRisk] = useState(null)
  const [explain, setExplain] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [timeFilter, setTimeFilter] = useState('All')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      await generateData()
      const forecastRes = await getForecast()
      const riskRes = await getRisk()
      const explainRes = await getExplain()
      
      setForecast(forecastRes.data)
      setRisk(riskRes.data)
      setExplain(explainRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load data. Please ensure the backend is running.')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-status-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-base sm:text-lg text-text-primary mb-2 font-semibold">Connection Error</p>
          <p className="text-sm text-text-secondary mb-6">{error}</p>
          <button 
            onClick={loadData}
            className="px-6 py-3 bg-gradient-primary text-white rounded-pill text-sm font-medium hover-lift shadow-glass min-h-touch"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const chartData = forecast?.predictions.map((val, idx) => ({
    hour: `${idx}:00`,
    load: val
  })) || []

  const getRiskColor = (level) => {
    switch(level) {
      case 'HIGH': return 'text-status-danger'
      case 'MEDIUM': return 'text-status-warning'
      default: return 'text-status-success'
    }
  }

  const getRiskIcon = (level) => {
    switch(level) {
      case 'HIGH': return '🔴'
      case 'MEDIUM': return '🟡'
      default: return '🟢'
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
      {/* Page Title */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-h1 text-text-primary mb-2">EV Grid Dashboard</h1>
        <p className="text-sm sm:text-base text-text-secondary">Real-time EV charging load monitoring and AI predictions</p>
      </div>

      {/* Top Section: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <MetricCard
          dark
          title="Peak Charging Hour"
          value={`${forecast?.peak_hour ?? '-'}:00`}
          subtitle="Expected peak demand"
          icon="🔌"
        />
        
        <MetricCard
          title="Max EV Load"
          value={`${risk?.max_load ?? '-'}`}
          subtitle="kW predicted demand"
          icon="⚡"
          trend={5.2}
        />
        
        <MetricCard
          title="Grid Capacity"
          value={`${risk?.capacity_percent ?? '-'}%`}
          subtitle="Current utilization"
          icon="🔋"
          trend={-2.1}
        />
        
        <MetricCard
          dark
          title="Charging Status"
          value={risk?.risk_level ?? '-'}
          subtitle="Grid health indicator"
          icon={getRiskIcon(risk?.risk_level)}
        />
      </div>

      {/* Middle Section: Main Chart + Risk Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Main Forecast Chart */}
        <div className="lg:col-span-2">
          <ChartCard 
            title="24-Hour EV Charging Forecast" 
            subtitle="Predicted charging demand pattern"
            actions={
              <div className="flex gap-2">
                {['All', 'Weekly', 'Monthly'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-pill text-xs font-medium transition-all min-h-touch ${
                      timeFilter === filter
                        ? 'bg-gradient-primary text-white shadow-glass'
                        : 'bg-bg-elevated text-text-secondary hover:bg-bg-subtle hover:text-text-primary'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={240} className="sm:h-[280px] lg:h-[320px]">
              <LineChart 
                data={chartData}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fill: '#A0A6B1', fontSize: 10 }}
                  axisLine={{ stroke: '#2F343A' }}
                  interval="preserveStartEnd"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fill: '#A0A6B1', fontSize: 10 }}
                  axisLine={{ stroke: '#2F343A' }}
                  width={40}
                  label={{ 
                    value: 'Load (kW)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: '#A0A6B1', fontSize: 10 },
                    className: "hidden sm:block"
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A1D21', 
                    border: '1px solid #2F343A',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#E6E8EB',
                    fontSize: '12px'
                  }}
                  cursor={{ stroke: '#5B7CFA', strokeWidth: 1 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="load" 
                  stroke="#5B7CFA" 
                  strokeWidth={2}
                  className="sm:stroke-[3]"
                  dot={false}
                  activeDot={{ r: 4, fill: '#5B7CFA', stroke: '#E6E8EB', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Risk Assessment Panel */}
        <div>
          <ChartCard dark title="Grid Health Monitor" subtitle="Real-time system metrics">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">Overload Risk</span>
                  <span className={`text-xs font-bold ${getRiskColor(risk?.risk_level)}`}>
                    {risk?.risk_level ?? '-'}
                  </span>
                </div>
                <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-primary rounded-full transition-all"
                    style={{ width: `${risk?.capacity_percent ?? 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle">
                <p className="text-xs text-text-muted mb-3">EV Charging Metrics</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-primary">Peak Demand</span>
                    <span className="text-xs font-bold text-text-primary">{risk?.max_load ?? '-'} kW</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-primary">Avg Demand</span>
                    <span className="text-xs font-bold text-text-primary">
                      {forecast?.predictions ? Math.round(forecast.predictions.reduce((a,b) => a+b, 0) / forecast.predictions.length) : '-'} kW
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-primary">Charging Efficiency</span>
                    <span className="text-xs font-bold text-status-success">94.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Bottom Section: AI Insights + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* AI Explainability */}
        <ChartCard title="AI Model Insights" subtitle="EV load prediction factors">
          <div className="space-y-3">
            {explain?.top_features?.slice(0, 5).map((feature, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-secondary capitalize truncate">{feature.feature.replace('_', ' ')}</span>
                  <span className="text-xs font-bold text-text-primary ml-2 flex-shrink-0">{(feature.importance * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-primary rounded-full"
                    style={{ width: `${feature.importance * 100}%` }}
                  ></div>
                </div>
              </div>
            )) || (
              <p className="text-xs text-text-secondary">Loading feature analysis...</p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <p className="text-xs text-text-secondary break-words">
              {explain?.summary ?? 'AI model analyzing EV charging patterns...'}
            </p>
          </div>
        </ChartCard>

        {/* System Status */}
        <ChartCard dark title="System Status" subtitle="EV infrastructure monitoring">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-border-subtle">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-2 h-2 rounded-full bg-status-success animate-pulse flex-shrink-0"></div>
                <span className="text-xs text-text-primary truncate">EV Forecasting Engine</span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-status-success/20 text-status-success rounded-full font-medium ml-2 flex-shrink-0">Active</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-border-subtle">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-2 h-2 rounded-full bg-status-success animate-pulse flex-shrink-0"></div>
                <span className="text-xs text-text-primary truncate">Grid Load Balancer</span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-status-success/20 text-status-success rounded-full font-medium ml-2 flex-shrink-0">Active</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-border-subtle">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-2 h-2 rounded-full bg-status-success animate-pulse flex-shrink-0"></div>
                <span className="text-xs text-text-primary truncate">Charging Data Stream</span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-status-success/20 text-status-success rounded-full font-medium ml-2 flex-shrink-0">Healthy</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-2 h-2 rounded-full bg-status-info flex-shrink-0"></div>
                <span className="text-xs text-text-primary truncate">Model Accuracy</span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-status-info/20 text-status-info rounded-full font-medium ml-2 flex-shrink-0">96.8%</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* CTA Button */}
      <div className="mt-4 sm:mt-6 flex justify-center sm:justify-end">
        <button className="w-full sm:w-auto px-6 py-3 bg-gradient-primary text-white rounded-pill text-sm font-semibold hover-lift shadow-glass min-h-touch">
          Upgrade to Pro
        </button>
      </div>
    </div>
  )
}

export default Dashboard
