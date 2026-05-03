import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getSchedule } from '../services/api'

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

  if (loading) return <div className="text-center text-xl">Loading...</div>
  if (error) return <div className="text-center text-red-600 text-xl">{error}</div>

  const chartData = schedule?.before.map((val, idx) => ({
    hour: idx,
    before: val,
    after: schedule.after[idx]
  })) || []

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Load Optimization Recommendation</h1>

      <div className="bg-gradient-to-r from-green-50 to-green-100 p-8 rounded-lg shadow-lg mb-6 border-l-4 border-green-500">
        <h3 className="text-sm text-gray-700 mb-2">Peak Load Reduction</h3>
        <p className="text-5xl font-bold text-green-600">{schedule?.improvement_percent ?? 0}%</p>
        <p className="text-gray-600 mt-2">Achieved by shifting EV charging to off-peak hours</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Load Profile Comparison</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" label={{ value: 'Hour', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Load (kW)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="before" stroke="#ef4444" strokeWidth={2} name="Before Optimization" />
            <Line type="monotone" dataKey="after" stroke="#22c55e" strokeWidth={2} name="After Optimization" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <p className="text-sm text-gray-700">
            <strong>Recommendation:</strong> Shift 25% of EV charging load from peak hours (18:00-22:00) to after 22:00 
            to reduce grid stress and improve efficiency.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Recommendation
