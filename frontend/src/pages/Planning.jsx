import React from 'react'

const locations = [
  { name: 'Location A - Downtown', score: 85, status: 'Good', color: 'green' },
  { name: 'Location B - Suburbs', score: 62, status: 'Fair', color: 'yellow' },
  { name: 'Location C - Industrial', score: 48, status: 'Needs Attention', color: 'red' }
]

function Planning() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Infrastructure Planning</h1>

      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <p className="text-gray-700">
          Grid health scores for different locations. Scores below 50 indicate need for infrastructure upgrades.
        </p>
      </div>

      <div className="grid gap-4">
        {locations.map((loc, idx) => {
          const colorClasses = {
            green: 'border-green-500 bg-green-50',
            yellow: 'border-yellow-500 bg-yellow-50',
            red: 'border-red-500 bg-red-50'
          }
          
          const scoreColor = {
            green: 'text-green-600',
            yellow: 'text-yellow-600',
            red: 'text-red-600'
          }

          return (
            <div key={idx} className={`bg-white p-6 rounded-lg shadow-lg border-l-4 ${colorClasses[loc.color]} flex justify-between items-center`}>
              <div>
                <h3 className="text-xl font-bold mb-1">{loc.name}</h3>
                <p className="text-gray-600">{loc.status}</p>
                <div className="mt-2">
                  <div className="w-64 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${loc.color === 'green' ? 'bg-green-500' : loc.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${loc.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className={`text-5xl font-bold ${scoreColor[loc.color]}`}>{loc.score}</div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-3">Recommendations</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Location A: Maintain current infrastructure, monitor during peak hours</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-500 mr-2">⚠</span>
            <span>Location B: Consider adding transformer capacity within 6 months</span>
          </li>
          <li className="flex items-start">
            <span className="text-red-500 mr-2">✗</span>
            <span>Location C: Urgent upgrade needed - schedule infrastructure assessment immediately</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Planning
