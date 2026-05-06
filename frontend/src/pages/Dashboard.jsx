import React, { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { generateData, getForecast, getRisk, getLoad, getSessions } from '../services/api'
import MetricCard from '../components/MetricCard'
import ChartCard from '../components/ChartCard'

// Pure aggregation functions
const filterAndSort = (data, days) => {
  if (!data || !data.length) return [];
  // data is ordered newest first (descending). Get the newest timestamp.
  const newestTime = new Date(data[0].timestamp).getTime();
  const cutoff = newestTime - (days * 24 * 60 * 60 * 1000);
  
  // Filter for records within the cutoff window, then reverse so oldest is first (chronological)
  return data.filter(item => new Date(item.timestamp).getTime() >= cutoff).reverse();
};

const aggregateDaily = (data, forecastData = []) => {
  const recent = filterAndSort(data, 1); // Last 24 hours
  const map = new Map();
  recent.forEach(item => {
    const d = new Date(item.timestamp);
    d.setMinutes(0, 0, 0); // Group by hour
    const label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (!map.has(label)) map.set(label, { sum: 0, count: 0, timestamp: item.timestamp });
    const group = map.get(label);
    group.sum += item.load_kw;
    group.count += 1;
  });
  
  const historical = Array.from(map.entries()).map(([label, group]) => ({
    label,
    load: parseFloat((group.sum / group.count).toFixed(2)),
    predicted: null,
    timestamp: group.timestamp
  }));
  
  const predicted = forecastData.map(item => {
    const d = new Date(item.timestamp);
    return {
      label: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      load: null,
      predicted: parseFloat(item.predicted_kwh.toFixed(2)),
      timestamp: item.timestamp,
      explanation: item.explanation
    };
  });
  
  return [...historical, ...predicted];
};

const aggregateWeekly = (data) => {
  const recent = filterAndSort(data, 7); // Last 7 days
  if (!recent.length) return [];
  const map = new Map();
  recent.forEach(item => {
    const d = new Date(item.timestamp);
    const label = d.toLocaleDateString([], { weekday: 'short' });
    if (!map.has(label)) map.set(label, { sum: 0, count: 0, timestamp: item.timestamp });
    const group = map.get(label);
    group.sum += item.load_kw;
    group.count += 1;
  });
  return Array.from(map.entries()).map(([label, group]) => ({
    label,
    load: parseFloat((group.sum / group.count).toFixed(2)),
    timestamp: group.timestamp
  }));
};

const aggregateMonthly = (data) => {
  const recent = filterAndSort(data, 30); // Last 30 days
  if (!recent.length) return [];
  const map = new Map();
  recent.forEach(item => {
    const d = new Date(item.timestamp);
    const label = `${d.getMonth()+1}/${d.getDate()}`;
    if (!map.has(label)) map.set(label, { sum: 0, count: 0, timestamp: item.timestamp });
    const group = map.get(label);
    group.sum += item.load_kw;
    group.count += 1;
  });
  return Array.from(map.entries()).map(([label, group]) => ({
    label,
    load: parseFloat((group.sum / group.count).toFixed(2)),
    timestamp: group.timestamp
  }));
};

function Dashboard() {
  const [forecast, setForecast] = useState([])
  const [risk, setRisk] = useState(null)
  const [actualLoad, setActualLoad] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [range, setRange] = useState('daily')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      await generateData()
      const [forecastRes, riskRes, loadRes, sessionsRes] = await Promise.all([
        getForecast(24),
        getRisk(),
        getLoad(2880), // Fetch a full month (30 days * 96 intervals)
        getSessions()
      ])
      
      setForecast(forecastRes.data.forecast || [])
      setRisk(riskRes.data)
      
      setActualLoad(loadRes.data)
      setSessions(sessionsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load data. Please ensure the backend is running.')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Compute datasets dynamically based on raw data
  const datasets = useMemo(() => {
    if (!actualLoad.length) return { daily: [], weekly: [], monthly: [] };
    return {
      daily: aggregateDaily(actualLoad, forecast),
      weekly: aggregateWeekly(actualLoad),
      monthly: aggregateMonthly(actualLoad)
    };
  }, [actualLoad, forecast]);

  const selectedData = datasets[range] || [];

  const maxRealLoad = selectedData.length > 0 ? Math.max(...selectedData.map(item => item.load)) : null
  const peakItem = selectedData.length > 0 ? selectedData.find(item => item.load === maxRealLoad) : null
  const peakTimeText = peakItem ? peakItem.label : '-'
  const avgRealLoad = selectedData.length > 0 ? (selectedData.reduce((sum, item) => sum + item.load, 0) / selectedData.length) : null

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
          title="Peak Charging Time"
          value={peakTimeText}
          subtitle="Recent peak demand"
          icon="🔌"
        />
        
        <MetricCard
          title="Max EV Load"
          value={maxRealLoad !== null ? maxRealLoad.toFixed(1) : '-'}
          subtitle="kW recent peak"
          icon="⚡"
          trend={5.2}
        />
        
        <MetricCard
          title="Active Sessions"
          value={sessions.length.toString()}
          subtitle="Recent EV charging sessions"
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
            title={`${range.charAt(0).toUpperCase() + range.slice(1)} EV Charging Forecast`} 
            subtitle="Predicted charging demand pattern"
            actions={
              <div className="flex gap-2">
                {['daily', 'weekly', 'monthly'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setRange(filter)}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-pill text-xs font-medium transition-all min-h-touch ${
                      range === filter
                        ? 'bg-gradient-primary text-white shadow-glass'
                        : 'bg-bg-elevated text-text-secondary hover:bg-bg-subtle hover:text-text-primary'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={240} className="sm:h-[280px] lg:h-[320px]">
              <LineChart 
                key={range}
                data={selectedData}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="label" 
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
                  name="Historical Load"
                  stroke="#5B7CFA" 
                  strokeWidth={2}
                  className="sm:stroke-[3]"
                  dot={false}
                  activeDot={{ r: 4, fill: '#5B7CFA', stroke: '#E6E8EB', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  name="AI Forecast"
                  stroke="#FFB020" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  className="sm:stroke-[3]"
                  dot={false}
                  activeDot={{ r: 4, fill: '#FFB020', stroke: '#E6E8EB', strokeWidth: 2 }}
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
                    <span className="text-xs font-bold text-text-primary">{maxRealLoad !== null ? maxRealLoad.toFixed(1) : '-'} kW</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-primary">Avg Demand</span>
                    <span className="text-xs font-bold text-text-primary">
                      {avgRealLoad !== null ? avgRealLoad.toFixed(1) : '-'} kW
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
          <div className="space-y-4">
            {forecast?.slice(0, 4).map((item, idx) => {
              const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={idx} className="pb-3 border-b border-border-subtle last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-text-primary">{timeStr} Prediction</span>
                    <span className="text-xs font-bold text-status-warning ml-2 flex-shrink-0">
                      {item.predicted_kwh.toFixed(1)} kW
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              );
            }) || (
              <p className="text-xs text-text-secondary">Loading feature analysis...</p>
            )}
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
