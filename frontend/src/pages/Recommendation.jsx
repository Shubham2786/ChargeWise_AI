import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getScheduleRecommendation } from '../services/api'
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
      const res = await getScheduleRecommendation()
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
          <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-text-secondary">Loading optimization...</p>
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
          <p className="text-sm text-text-secondary">{error}</p>
        </div>
      </div>
    )
  }

  const chartData = schedule?.schedule?.map((step) => {
    const d = new Date(step.timestamp);
    return {
      hour: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      before: parseFloat(step.uncontrolled_load_kw.toFixed(2)),
      after: parseFloat(step.total_load_kw.toFixed(2))
    }
  }) || []

  const improvement = schedule?.peak_reduction_percent ?? 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
      {/* Page Title */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-h1 text-text-primary mb-2">EV Load Optimization</h1>
        <p className="text-sm sm:text-base text-text-secondary">AI-powered EV charging load shifting recommendations</p>
      </div>

      {/* Impact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <MetricCard
          dark
          title="Peak Reduction"
          value={`${improvement.toFixed(1)}%`}
          subtitle="Through smart EV scheduling"
          icon="📉"
        />
        
        <MetricCard
          title="Strategy"
          value="Smart Charging"
          subtitle="Shift EV loads to off-peak"
          icon="🔋"
        />
        
        <MetricCard
          dark
          title="Time Window"
          value="18:00-22:00"
          subtitle="Target hours for optimization"
          icon="⏱️"
        />
      </div>

      {/* Comparison Chart */}
      <div className="mb-4 sm:mb-6">
        <ChartCard 
          title="EV Charging Load Comparison" 
          subtitle="Before and after smart scheduling"
        >
          <ResponsiveContainer width="100%" height={280} className="sm:h-[340px] lg:h-[380px]">
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
                  value: 'EV Load (kW)', 
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
              <Legend 
                verticalAlign="top"
                height={36}
                wrapperStyle={{ 
                  paddingBottom: '10px',
                  fontSize: '11px'
                }}
                className="sm:text-xs"
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="before" 
                stroke="#8A94A6" 
                strokeWidth={1.5}
                className="sm:stroke-2"
                strokeDasharray="5 5"
                name="Before Smart Charging"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="after" 
                stroke="#5B7CFA" 
                strokeWidth={2}
                className="sm:stroke-[3]"
                name="After Smart Charging"
                dot={false}
                activeDot={{ r: 4, fill: '#5B7CFA', stroke: '#E6E8EB', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartCard title="Implementation Steps" subtitle="Follow these actions">
          <div className="space-y-4">
            {[
              { step: 1, title: 'Identify Peak Hours', desc: 'Monitor EV charging between 18:00-22:00' },
              { step: 2, title: 'Shift EV Charging', desc: 'Move 25% of EV load to after 22:00' },
              { step: 3, title: 'Monitor Results', desc: 'Track EV peak reduction metrics' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-button bg-gradient-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary mb-1 break-words">{item.title}</p>
                  <p className="text-xs text-text-secondary break-words">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard dark title="Expected Benefits" subtitle="Projected improvements">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-border-subtle">
              <span className="text-xs text-text-muted">Peak EV Load Reduction</span>
              <span className="text-sm text-text-primary font-bold">{improvement.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border-subtle">
              <span className="text-xs text-text-muted">EV Grid Stability</span>
              <span className="text-xs px-2.5 py-1 bg-status-success/20 text-status-success rounded-full font-medium">Improved</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border-subtle">
              <span className="text-xs text-text-muted">Energy Cost Savings</span>
              <span className="text-sm text-text-primary font-bold">15-20%</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-xs text-text-muted">Implementation Time</span>
              <span className="text-sm text-text-primary font-bold">2-4 weeks</span>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

export default Recommendation
