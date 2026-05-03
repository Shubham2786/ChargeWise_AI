import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getSchedule } from '../services/api'
import TopBar from '../components/TopBar'
import ChartCard from '../components/ChartCard'
import MetricCard from '../components/MetricCard'

function Recommendation() {
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadSchedule = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getSchedule()
      setSchedule(res.data)
    } catch (error) {
      console.error('Error loading schedule:', error)
      setError('Failed to load schedule. Please ensure the backend is running.')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSchedule()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-dark border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-small text-text-secondary">Loading optimization...</p>
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
        </div>
      </div>
    )
  }

  const chartData = schedule?.before.map((val, idx) => ({
    hour: `${idx}:00`,
    before: val,
    after: schedule.after[idx]
  })) || []

  const improvement = schedule?.improvement_percent ?? 0

  return (
    <div>
      <TopBar 
        title="Load Optimization" 
        subtitle="AI-powered load shifting recommendations"
      />
      
      <div className="p-8">
        {/* Impact Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Peak Reduction"
            value={`${improvement.toFixed(1)}%`}
            subtitle="Achieved through load shifting"
            icon="📉"
          />
          
          <MetricCard
            title="Strategy"
            value="EV Shifting"
            subtitle="Move charging to off-peak hours"
            icon="🔋"
          />
          
          <MetricCard
            title="Time Window"
            value="18:00-22:00"
            subtitle="Target hours for optimization"
            icon="⏱️"
          />
        </div>

        {/* Comparison Chart */}
        <div className="mb-8">
          <ChartCard 
            title="Load Profile Comparison" 
            subtitle="Before and after optimization"
          >
            <ResponsiveContainer width="100%" height={400}>
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
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="before" 
                  stroke="#8f8f8f" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Before Optimization"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="after" 
                  stroke="#1f1f1f" 
                  strokeWidth={2}
                  name="After Optimization"
                  dot={false}
                  activeDot={{ r: 6, fill: '#1f1f1f' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-primary-white rounded-card p-6 shadow-card">
            <h3 className="text-h3 text-text-primary mb-4">Implementation Steps</h3>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Identify Peak Hours', desc: 'Monitor load between 18:00-22:00' },
                { step: 2, title: 'Shift EV Charging', desc: 'Move 25% of load to after 22:00' },
                { step: 3, title: 'Monitor Results', desc: 'Track peak reduction metrics' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-button bg-primary-dark text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-small text-text-primary font-medium mb-1">{item.title}</p>
                    <p className="text-xs text-text-secondary">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary-white rounded-card p-6 shadow-card">
            <h3 className="text-h3 text-text-primary mb-4">Expected Benefits</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-small text-text-secondary">Peak Load Reduction</span>
                <span className="text-small text-text-primary font-medium">{improvement.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-small text-text-secondary">Grid Stability</span>
                <span className="text-small text-text-primary font-medium">Improved</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-small text-text-secondary">Cost Savings</span>
                <span className="text-small text-text-primary font-medium">Estimated 15-20%</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-small text-text-secondary">Implementation Time</span>
                <span className="text-small text-text-primary font-medium">2-4 weeks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Recommendation
