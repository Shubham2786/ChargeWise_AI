import React from 'react'

const MetricCard = ({ title, value, subtitle, trend, icon, dark = false }) => {
  return (
    <div className={`rounded-card p-4 sm:p-5 shadow-glass hover-lift ${
      dark ? 'glass-dark' : 'bg-bg-card'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className={`text-xs sm:text-sm font-medium mb-2 ${
            dark ? 'text-text-muted' : 'text-text-secondary'
          }`}>
            {title}
          </p>
          <h3 className={`text-xl sm:text-2xl font-bold truncate ${
            dark ? 'text-text-primary' : 'text-text-primary'
          }`}>
            {value}
          </h3>
        </div>
        {icon && (
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-button flex items-center justify-center text-lg sm:text-xl flex-shrink-0 ${
            dark ? 'bg-bg-elevated' : 'bg-bg-elevated'
          }`}>
            {icon}
          </div>
        )}
      </div>
      {subtitle && (
        <p className={`text-xs break-words ${
          dark ? 'text-text-muted' : 'text-text-secondary'
        }`}>
          {subtitle}
        </p>
      )}
      {trend && (
        <div className={`text-xs mt-2 font-medium flex items-center gap-1 ${
          trend > 0 ? 'text-status-success' : 'text-status-danger'
        }`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}

export default MetricCard
