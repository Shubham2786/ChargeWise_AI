import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { generateData, getForecast, getRisk, getExplain } from '../services/api'

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

  if (loading) return <div className="text-center text-xl">Loading...</div>
  if (error) return <div className="text-center text-red-600 text-xl">{error}</div>

  const chartData = forecast?.predictions.map((val, idx) => ({
    hour: idx,
    load: val
  })) || []

  const riskColor = risk?.risk_level === 'HIGH' ? 'text-red-600 bg-red-50' : 
                    risk?.risk_level === 'MEDIUM' ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50'

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-2">Peak Hour</h3>
          <p className="text-3xl font-bold text-blue-600">{forecast?.peak_hour ?? '-'}:00</p>
        </div>
        <div className={`p-6 rounded-lg shadow ${riskColor}`}>
          <h3 className="text-sm mb-2">Risk Level</h3>
          <p className="text-3xl font-bold">{risk?.risk_level ?? '-'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-2">Capacity Usage</h3>
          <p className="text-3xl font-bold text-purple-600">{risk?.capacity_percent ?? '-'}%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">24-Hour Load Forecast</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" label={{ value: 'Hour', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Load (kW)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="load" stroke="#2563eb" strokeWidth={2} name="Predicted Load" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-3">AI Explanation</h3>
        <p className="text-gray-700 text-lg">{explain?.summary ?? 'Loading explanation...'}</p>
      </div>
    </div>
  )
}

export default Dashboard
