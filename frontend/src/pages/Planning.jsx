import React from 'react'

const locations = [
  { 
    name: 'Downtown EV Charging Hub', 
    score: 85, 
    status: 'Excellent', 
    capacity: '95%',
    lastMaintenance: '2 weeks ago',
    nextInspection: 'In 3 months',
    priority: 'low'
  },
  { 
    name: 'Suburban Charging Station', 
    score: 62, 
    status: 'Fair', 
    capacity: '78%',
    lastMaintenance: '6 months ago',
    nextInspection: 'In 1 month',
    priority: 'medium'
  },
  { 
    name: 'Industrial Zone Fast Chargers', 
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
    if (score >= 80) return 'text-status-success'
    if (score >= 60) return 'text-status-warning'
    return 'text-status-danger'
  }

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-status-success/10'
    if (score >= 60) return 'bg-status-warning/10'
    return 'bg-status-danger/10'
  }

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-status-success/20 text-status-success',
      medium: 'bg-status-warning/20 text-status-warning',
      high: 'bg-gradient-primary text-white'
    }
    return styles[priority] || styles.low
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
      {/* Page Title */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-h1 text-text-primary mb-2">EV Infrastructure Planning</h1>
        <p className="text-sm sm:text-base text-text-secondary">EV charging station health monitoring and maintenance scheduling</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="glass-dark rounded-card p-4 sm:p-5 shadow-glass hover-lift">
          <p className="text-xs sm:text-sm text-text-muted mb-2">Total Stations</p>
          <p className="text-xl sm:text-2xl text-text-primary font-bold">3</p>
        </div>
        <div className="bg-bg-card rounded-card p-4 sm:p-5 shadow-glass hover-lift">
          <p className="text-xs sm:text-sm text-text-secondary mb-2">Station Health</p>
          <p className="text-xl sm:text-2xl text-text-primary font-bold">65</p>
        </div>
        <div className="glass-dark rounded-card p-4 sm:p-5 shadow-glass hover-lift">
          <p className="text-xs sm:text-sm text-text-muted mb-2">Needs Attention</p>
          <p className="text-xl sm:text-2xl text-text-primary font-bold">1</p>
        </div>
        <div className="bg-bg-card rounded-card p-4 sm:p-5 shadow-glass hover-lift">
          <p className="text-xs sm:text-sm text-text-secondary mb-2">Upcoming Checks</p>
          <p className="text-xl sm:text-2xl text-text-primary font-bold">2</p>
        </div>
      </div>

      {/* Location Cards */}
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        {locations.map((loc, idx) => (
          <div key={idx} className="bg-bg-card rounded-card p-4 sm:p-6 shadow-glass hover-lift">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="text-base sm:text-lg font-semibold text-text-primary break-words">{loc.name}</h3>
                  <span className={`text-xs px-2.5 sm:px-3 py-1 rounded-pill font-medium ${getPriorityBadge(loc.priority)}`}>
                    {loc.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary">{loc.status}</p>
              </div>
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-card ${getScoreBg(loc.score)} flex items-center justify-center self-start flex-shrink-0`}>
                <span className={`text-xl sm:text-2xl font-bold ${getScoreColor(loc.score)}`}>{loc.score}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-border-subtle">
              <div>
                <p className="text-xs text-text-muted mb-1">Capacity Usage</p>
                <p className="text-sm font-semibold text-text-primary">{loc.capacity}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Last Maintenance</p>
                <p className="text-sm font-semibold text-text-primary break-words">{loc.lastMaintenance}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Next Inspection</p>
                <p className="text-sm font-semibold text-text-primary break-words">{loc.nextInspection}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Health Score</p>
                <div className="w-full bg-bg-elevated rounded-full h-2 mt-1.5">
                  <div 
                    className="bg-gradient-primary h-2 rounded-full transition-all"
                    style={{ width: `${loc.score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="glass-dark rounded-card p-4 sm:p-6 shadow-glass">
        <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-4">Priority Actions</h3>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 sm:p-4 rounded-button bg-bg-elevated">
            <div className="w-7 h-7 rounded-full bg-gradient-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              1
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary mb-1 break-words">Industrial Zone Fast Chargers - Urgent Assessment</p>
              <p className="text-xs text-text-muted break-words">Schedule immediate inspection. Charger health below threshold. Maintenance overdue by 3 months.</p>
            </div>
            <button className="px-4 py-2.5 bg-gradient-primary text-white rounded-pill text-xs font-medium hover-lift shadow-glass whitespace-nowrap self-start sm:self-auto min-h-touch">
              Schedule
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 sm:p-4 rounded-button hover:bg-bg-elevated transition-colors">
            <div className="w-7 h-7 rounded-full bg-bg-subtle text-text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary mb-1 break-words">Suburban Charging Station - Routine Maintenance</p>
              <p className="text-xs text-text-muted break-words">Plan maintenance within next 30 days. Consider adding more charging ports.</p>
            </div>
            <button className="px-4 py-2.5 bg-bg-elevated text-text-primary rounded-pill text-xs font-medium hover:bg-bg-subtle transition-colors whitespace-nowrap self-start sm:self-auto min-h-touch">
              Plan
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 sm:p-4 rounded-button hover:bg-bg-elevated transition-colors">
            <div className="w-7 h-7 rounded-full bg-bg-subtle text-text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
              3
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary mb-1 break-words">Downtown EV Hub - Continue Monitoring</p>
              <p className="text-xs text-text-muted break-words">Excellent health status. Maintain current inspection schedule.</p>
            </div>
            <button className="px-4 py-2.5 bg-bg-elevated text-text-primary rounded-pill text-xs font-medium hover:bg-bg-subtle transition-colors whitespace-nowrap self-start sm:self-auto min-h-touch">
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Planning
