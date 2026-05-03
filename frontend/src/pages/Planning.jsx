import React from 'react'
import TopBar from '../components/TopBar'

const locations = [
  { 
    name: 'Downtown Grid Station', 
    score: 85, 
    status: 'Excellent', 
    capacity: '95%',
    lastMaintenance: '2 weeks ago',
    nextInspection: 'In 3 months',
    priority: 'low'
  },
  { 
    name: 'Suburban Distribution Hub', 
    score: 62, 
    status: 'Fair', 
    capacity: '78%',
    lastMaintenance: '6 months ago',
    nextInspection: 'In 1 month',
    priority: 'medium'
  },
  { 
    name: 'Industrial Zone Transformer', 
    score: 48, 
    status: 'Needs Attention', 
    capacity: '92%',
    lastMaintenance: '1 year ago',
    nextInspection: 'Overdue',
    priority: 'high'
  }
]

function Planning() {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-text-primary'
    if (score >= 60) return 'text-text-secondary'
    return 'text-text-primary'
  }

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-primary-bg'
    if (score >= 60) return 'bg-primary-bg'
    return 'bg-primary-dark text-white'
  }

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-primary-bg text-text-secondary',
      medium: 'bg-primary-bg text-text-primary',
      high: 'bg-primary-dark text-white'
    }
    return styles[priority] || styles.low
  }

  return (
    <div>
      <TopBar 
        title="Infrastructure Planning" 
        subtitle="Grid health monitoring and maintenance scheduling"
      />
      
      <div className="p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-primary-white rounded-card p-6 shadow-card">
            <p className="text-small text-text-secondary mb-2">Total Locations</p>
            <p className="text-h2 text-text-primary font-bold">3</p>
          </div>
          <div className="bg-primary-white rounded-card p-6 shadow-card">
            <p className="text-small text-text-secondary mb-2">Average Health</p>
            <p className="text-h2 text-text-primary font-bold">65</p>
          </div>
          <div className="bg-primary-white rounded-card p-6 shadow-card">
            <p className="text-small text-text-secondary mb-2">Needs Attention</p>
            <p className="text-h2 text-text-primary font-bold">1</p>
          </div>
          <div className="bg-primary-white rounded-card p-6 shadow-card">
            <p className="text-small text-text-secondary mb-2">Upcoming Inspections</p>
            <p className="text-h2 text-text-primary font-bold">2</p>
          </div>
        </div>

        {/* Location Cards */}
        <div className="space-y-4 mb-8">
          {locations.map((loc, idx) => (
            <div key={idx} className="bg-primary-white rounded-card p-6 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-h3 text-text-primary">{loc.name}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPriorityBadge(loc.priority)}`}>
                      {loc.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-small text-text-secondary">{loc.status}</p>
                </div>
                <div className={`w-16 h-16 rounded-card ${getScoreBg(loc.score)} flex items-center justify-center`}>
                  <span className={`text-2xl font-bold ${getScoreColor(loc.score)}`}>{loc.score}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-text-secondary mb-1">Capacity Usage</p>
                  <p className="text-small text-text-primary font-medium">{loc.capacity}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary mb-1">Last Maintenance</p>
                  <p className="text-small text-text-primary font-medium">{loc.lastMaintenance}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary mb-1">Next Inspection</p>
                  <p className="text-small text-text-primary font-medium">{loc.nextInspection}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary mb-1">Health Score</p>
                  <div className="w-full bg-primary-bg rounded-full h-2 mt-1">
                    <div 
                      className="bg-primary-dark h-2 rounded-full transition-all"
                      style={{ width: `${loc.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="bg-primary-white rounded-card p-6 shadow-card">
          <h3 className="text-h3 text-text-primary mb-4">Priority Actions</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-button bg-primary-bg">
              <div className="w-6 h-6 rounded-full bg-primary-dark text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <p className="text-small text-text-primary font-medium mb-1">Industrial Zone Transformer - Urgent Assessment</p>
                <p className="text-xs text-text-secondary">Schedule immediate inspection. Health score below threshold. Maintenance overdue by 3 months.</p>
              </div>
              <button className="px-4 py-2 bg-primary-dark text-white rounded-button text-xs font-medium hover:opacity-90 transition-opacity">
                Schedule
              </button>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-button hover:bg-primary-bg transition-colors">
              <div className="w-6 h-6 rounded-full bg-primary-bg text-text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <p className="text-small text-text-primary font-medium mb-1">Suburban Hub - Routine Maintenance</p>
                <p className="text-xs text-text-secondary">Plan maintenance within next 30 days. Consider capacity upgrade evaluation.</p>
              </div>
              <button className="px-4 py-2 border border-border rounded-button text-xs font-medium hover:bg-primary-bg transition-colors">
                Plan
              </button>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-button hover:bg-primary-bg transition-colors">
              <div className="w-6 h-6 rounded-full bg-primary-bg text-text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <p className="text-small text-text-primary font-medium mb-1">Downtown Station - Continue Monitoring</p>
                <p className="text-xs text-text-secondary">Excellent health status. Maintain current inspection schedule.</p>
              </div>
              <button className="px-4 py-2 border border-border rounded-button text-xs font-medium hover:bg-primary-bg transition-colors">
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Planning
