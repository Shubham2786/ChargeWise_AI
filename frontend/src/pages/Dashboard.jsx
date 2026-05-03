import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { generateData, getForecast, getRisk, getExplain } from '../services/api'
import TopBar from '../components/TopBar'
import MetricCard from '../components/MetricCard'
import ChartCard from '../components/ChartCard'

function Dashboard() {
  const [forecast, setForecast] = useState(null)
  const [risk, setRisk] = useState(null)
  const [explain, setExplain] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
          <div className="w-12 h-12 border-4 border-primary-dark border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-small text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-body text-text-primary mb-2">Connection Error</p>
          <p className="text-small text-text-secondary">{error}</p>
          <button 
            onClick={loadData}
            className="mt-6 px-6 py-3 bg-primary-dark text-white rounded-button text-small font-medium hover:opacity-90 transition-opacity"
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
      case 'HIGH': return 'text-text-primary'
      case 'MEDIUM': return 'text-text-secondary'
      default: return 'text-text-muted'
    }
  }

  const getRiskBg = (level) => {
    switch(level) {
      case 'HIGH': return 'bg-primary-dark text-white'
      case 'MEDIUM': return 'bg-primary-bg text-text-primary'
      default: return 'bg-primary-bg text-text-secondary'
    }
  }

  return (
    <div>
      <TopBar 
        title="Load Forecasting Dashboard" 
        subtitle="Real-time grid monitoring and predictions"
      />
      
      <div className="p-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Peak Hour"
            value={`${forecast?.peak_hour ?? '-'}:00`}
            subtitle="Expected peak load time"
            icon="⏰"
          />
          
          <MetricCard
            title="Risk Level"
            value={risk?.risk_level ?? '-'}
            subtitle="Current system status"
            icon={
              <span className={`text-sm font-bold ${getRiskColor(risk?.risk_level)}`}>
                {risk?.risk_level === 'HIGH' ? '🔴' : risk?.risk_level === 'MEDIUM' ? '🟡' : '🟢'}
              </span>
            }
          />
          
          <MetricCard
            title="Capacity Usage"
            value={`${risk?.capacity_percent ?? '-'}%`}
            subtitle="Of maximum capacity"
            icon="📊"
          />
          
          <MetricCard
            title="Max Load"
            value={`${risk?.max_load ?? '-'} kW`}
            subtitle="Peak predicted load"
            icon="⚡"
          />
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <ChartCard 
            title="24-Hour Load Forecast" 
            subtitle="Predicted energy consumption for the next 24 hours"
          >
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fill: '#4f4f4f', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(0,0,0,0.06)' }}
                />
                <YAxis 
                  tick={{ fill: '#4f4f4f', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(0,0,0,0.06)' }}
                  label={{ value: 'Load (kW)', angle: -90, position: 'insideLeft', style: { fill: '#4f4f4f', fontSize: 12 } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '12px',
                    padding: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="load" 
                  stroke="#1f1f1f" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: '#1f1f1f' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Insights Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-primary-white rounded-card p-6 shadow-card">
            <h3 className="text-h3 text-text-primary mb-4">AI Insights</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-button bg-primary-bg flex items-center justify-center flex-shrink-0">
                  🧠
                </div>
                <div>
                  <p className="text-small text-text-primary font-medium mb-1">Model Analysis</p>
                  <p className="text-small text-text-secondary">{explain?.summary ?? 'Loading analysis...'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary-white rounded-card p-6 shadow-card">
            <h3 className="text-h3 text-text-primary mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-small text-text-secondary">Forecasting Model</span>
                <span className="text-xs px-3 py-1 bg-primary-bg text-text-primary rounded-full font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-small text-text-secondary">Risk Detection</span>
                <span className="text-xs px-3 py-1 bg-primary-bg text-text-primary rounded-full font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-small text-text-secondary">Data Quality</span>
                <span className="text-xs px-3 py-1 bg-primary-bg text-text-primary rounded-full font-medium">Excellent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
